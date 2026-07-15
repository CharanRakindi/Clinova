import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendToUser } from '../services/socketService.js';
import { doctorHasPatientAccess } from '../utils/careAccess.js';

/** Roles that may use secure messaging */
const MSG_ROLES = ['patient', 'doctor', 'admin'];

// @desc    List conversations (latest message per peer)
// @route   GET /api/v1/messages/conversations
export const listConversations = async (req, res, next) => {
  try {
    if (!MSG_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Messaging not available for this role' });
    }

    const me = req.user._id;
    const messages = await Message.find({
      $or: [{ from: me }, { to: me }],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('from', 'name role')
      .populate('to', 'name role');

    const map = new Map();
    for (const m of messages) {
      const peerId =
        m.from._id.toString() === me.toString()
          ? m.to._id.toString()
          : m.from._id.toString();
      if (map.has(peerId)) continue;
      const peer = m.from._id.toString() === me.toString() ? m.to : m.from;
      map.set(peerId, {
        peer,
        lastMessage: {
          _id: m._id,
          body: m.body,
          createdAt: m.createdAt,
          fromMe: m.from._id.toString() === me.toString(),
          readAt: m.readAt,
        },
      });
    }

    res.status(200).json({ success: true, data: [...map.values()] });
  } catch (error) {
    next(error);
  }
};

// @desc    Thread with a user
// @route   GET /api/v1/messages/with/:userId
export const getThread = async (req, res, next) => {
  try {
    if (!MSG_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const peerId = req.params.userId;
    const peer = await User.findById(peerId).select('name role isActive');
    if (!peer || !peer.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ok = await canMessage(req.user, peer);
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: 'You can only message after a care relationship is established',
      });
    }

    const me = req.user._id;
    const thread = await Message.find({
      $or: [
        { from: me, to: peerId },
        { from: peerId, to: me },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('from', 'name role')
      .populate('to', 'name role');

    // Mark inbound as read
    await Message.updateMany(
      { from: peerId, to: me, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.status(200).json({ success: true, data: { peer, messages: thread } });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/v1/messages
export const sendMessage = async (req, res, next) => {
  try {
    if (!MSG_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { to, body } = req.body;
    const text = String(body || '').trim();
    if (!to || !text) {
      return res.status(400).json({ success: false, message: 'Recipient and body are required' });
    }
    if (text.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message too long' });
    }

    const peer = await User.findById(to).select('name role isActive');
    if (!peer || !peer.isActive) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const ok = await canMessage(req.user, peer);
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: 'You can only message after a care relationship is established',
      });
    }

    const msg = await Message.create({
      from: req.user._id,
      to: peer._id,
      body: text,
    });

    const populated = await Message.findById(msg._id)
      .populate('from', 'name role')
      .populate('to', 'name role');

    sendToUser(peer._id, 'notification', {
      message: `New message from ${req.user.name}`,
      timestamp: new Date(),
      type: 'message',
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

async function canMessage(me, peer) {
  if (me.role === 'admin') return true;
  if (me._id.toString() === peer._id.toString()) return false;

  // Patient ↔ doctor only when care link exists
  if (me.role === 'patient' && peer.role === 'doctor') {
    return doctorHasPatientAccess(peer._id, me._id);
  }
  if (me.role === 'doctor' && peer.role === 'patient') {
    return doctorHasPatientAccess(me._id, peer._id);
  }
  // Doctor-admin optional
  if (me.role === 'doctor' && peer.role === 'admin') return true;
  if (me.role === 'admin') return true;
  return false;
}
