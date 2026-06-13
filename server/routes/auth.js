const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AdminAccount = require('../models/AdminAccount');
const BusinessAccount = require('../models/BusinessAccount');
const logAction = require('../utils/logger');
const { calculateRank } = require('../utils/rankUtils');
const Itinerary = require('../models/Itinerary');
const Conversation = require('../models/Conversation');
const Place = require('../models/Place');
const Post = require('../models/Post');
const Friendship = require('../models/Friendship');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../utils/email');

const JWT_SECRET = (process.env.JWT_SECRET || 'wander-viet-secret-key-123').trim();
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@wanderviet.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'password@2006';

const signPortalToken = (account, portal, role) => {
  const accountId = account.customId || account.id || account._id.toString();
  const payload = {
    id: accountId,
    _id: account._id.toString(),
    customId: account.customId || account.id,
    email: account.email,
    name: account.name,
    displayName: account.displayName || account.name,
    role,
    status: account.status || 'active',
    portal
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const generateCustomId = (roleOrKind) => {
  let prefix = 'user';
  if (roleOrKind === 'business') prefix = 'business';
  else if (roleOrKind === 'admin' || roleOrKind === 'superadmin') prefix = 'admin';
  else if (roleOrKind === 'diem-du-lich' || roleOrKind === 'tour') prefix = 'tour';
  else if (roleOrKind === 'tien-ich' || roleOrKind === 'service') prefix = 'service';
  
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${randomNum}`;
};

// Memory cache for authenticated users to avoid DB lookup on every request
const authCache = new Map();
const AUTH_CACHE_TTL = 60 * 1000; // 1 minute cache

function getFromCache(id, portal) {
  const key = `${portal}_${id}`;
  const entry = authCache.get(key);
  if (entry && Date.now() - entry.timestamp < AUTH_CACHE_TTL) {
    return entry.user;
  }
  return null;
}

function setInCache(id, portal, user) {
  const key = `${portal}_${id}`;
  authCache.set(key, { user, timestamp: Date.now() });
}

function clearAuthCache(id, portal) {
  const key = `${portal}_${id}`;
  authCache.delete(key);
}

const verifyPortalToken = (expectedPortal) => async (req, res, next) => {
  let token = req.header('x-auth-token');
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'null' || token === 'undefined') {
    if (expectedPortal === null) return next(); 
    return res.status(401).json({ success: false, message: 'Không có token, từ chối quyền truy cập' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Flexible account extraction
    const account = decoded.account || decoded.user || (decoded.id ? decoded : null);
    if (!account) return res.status(401).json({ success: false, message: 'Auth: Invalid token structure' });
    
    const accountId = account.id || account._id || account.customId;
    if (!account || !accountId) return res.status(401).json({ success: false, message: 'Auth: Token missing account ID' });
    
    // Standardize portal and prevent cross-portal token usage early
    if (!account.portal) {
      if (decoded.role === 'admin' || decoded.role === 'superadmin') account.portal = 'admin';
      else if (decoded.portal) account.portal = decoded.portal;
      else account.portal = 'user'; // Default for old tokens
    }
    
    const isPortalCheckRequired = expectedPortal && expectedPortal !== null && expectedPortal !== 'null';
    if (isPortalCheckRequired && account.portal !== expectedPortal) {
      console.warn(`[Auth] Portal mismatch: Expected ${expectedPortal}, but token is for ${account.portal}`);
      return res.status(403).json({ 
        success: false, 
        message: `Quyền truy cập bị từ chối: Token này thuộc cổng ${account.portal}, không phải ${expectedPortal}.`,
        code: 'PORTAL_MISMATCH'
      });
    }

    account.id = accountId; 
    
    // Try cache first
    const skipCache = req.query.t || req.headers['x-skip-cache'];
    const cachedUser = skipCache ? null : getFromCache(accountId, account.portal);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const modelMap = { 'user': User, 'business': BusinessAccount, 'admin': AdminAccount };
    const Model = modelMap[account.portal];
    
    if (Model) {
      const query = {
        $or: [
          { customId: accountId },
          { id: accountId }
        ]
      };
      if (mongoose.Types.ObjectId.isValid(accountId)) {
        query.$or.push({ _id: accountId });
      }

      const accountData = await Model.findOne(query).lean();
      if (!accountData) {
        console.warn(`Auth: Account ${accountId} not found in ${account.portal} collection`);
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc phiên làm việc đã hết hạn.' });
      }
      
      // Update lastActive less frequently (every 15 mins instead of 5)
      const now = new Date();
      const lastActive = accountData.lastActive || new Date(0);
      if (now - lastActive > 15 * 60 * 1000) {
        Model.updateOne({ _id: accountData._id }, { $set: { lastActive: now } }).exec().catch(() => {});
      }

      if (accountData.status === 'suspended') return res.status(403).json({ success: false, message: 'Auth: Account suspended' });
      
      req.user = {
        _id: accountData._id.toString(),
        customId: accountData.customId || accountData.id,
        id: accountData.customId || accountData.id || accountData._id.toString(),
        email: accountData.email,
        role: accountData.role || (account.portal === 'admin' ? 'admin' : account.portal),
        status: accountData.status,
        displayName: accountData.displayName || accountData.name,
        name: accountData.name,
        avatar: accountData.avatar || '',
        portal: account.portal || expectedPortal || 'user',
        points: accountData.points || 0,
        rank: accountData.rank || 'Đồng',
        rankTier: accountData.rankTier || 'I',
        claimedQuests: accountData.claimedQuests || [],
        favorites: accountData.favorites || [],
        cover: accountData.cover || '',
        notes: accountData.notes || ''
      };
      
      setInCache(accountId, account.portal || expectedPortal || 'user', req.user);
    } else {
      req.user = {
        _id: account._id || account.id,
        customId: account.customId || account.id,
        id: accountId,
        email: account.email,
        role: account.role,
        status: account.status,
        displayName: account.displayName || account.name,
        name: account.name,
        avatar: account.avatar || '',
        cover: account.cover || '',
        notes: account.notes || '',
        portal: account.portal
      };
    }
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' && err.message === 'invalid signature') {
      console.warn(`[Auth] Signature mismatch from ${req.ip}. Cleared stale token on server.`);
      return res.status(401).json({ success: false, message: 'Auth: Invalid signature' });
    } 
    
    // Xử lý lỗi kết nối Database (DNS, Network)
    if (err.name === 'MongoNetworkError' || err.message.includes('getaddrinfo') || err.message.includes('selection timeout')) {
      console.error('❌ Database Connection Error during Auth:', err.message);
      return res.status(503).json({ 
        success: false, 
        message: 'Dịch vụ tạm thời không khả dụng do lỗi kết nối máy chủ dữ liệu. Vui lòng kiểm tra mạng của bạn.',
        error: 'DATABASE_CONNECTION_ERROR' 
      });
    }

    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ success: false, message: 'Auth: JWT verification failed', error: err.message });
  }
};

const auth = verifyPortalToken('user');
const businessAuth = verifyPortalToken('business');
const adminTokenAuth = verifyPortalToken('admin');
const sharedAuth = verifyPortalToken(null);

async function ensureDefaultAdmin() {
  await AdminAccount.deleteMany({ email: 'root@wanderviet.com' });
  await AdminAccount.updateMany(
    { email: { $ne: DEFAULT_ADMIN_EMAIL }, role: 'superadmin' },
    { $set: { role: 'admin' } }
  );
  let admin = await AdminAccount.findOne({ email: DEFAULT_ADMIN_EMAIL });
  const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  if (!admin) {
    admin = new AdminAccount({
      customId: generateCustomId('superadmin'),
      name: 'Super Admin',
      displayName: 'Super Admin',
      email: DEFAULT_ADMIN_EMAIL,
      password: hashed,
      role: 'superadmin',
      status: 'active'
    });
    await admin.save();
    return;
  }
  admin.password = hashed;
  admin.role = 'superadmin';
  admin.status = 'active';
  if (!admin.name) admin.name = 'Super Admin';
  if (!admin.displayName) admin.displayName = 'Super Admin';
  await admin.save();
}

// USER portal: đăng ký
router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    user = new User({
      customId: generateCustomId('user'),
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      displayName: name,
      role: 'user',
      status: 'active'
    });
    await user.save();
    const token = signPortalToken(user, 'user', 'user');
    await logAction(user.email, 'user', 'USER_REGISTER', { user: { id: user.id, email: user.email, displayName: user.name, role: user.role } }, req.ip, req.headers['user-agent']);
    res.json({ 
      success: true, 
      token, 
      user: { 
        _id: user._id.toString(),
        customId: user.customId || user.id,
        id: user.customId || user.id || user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role || 'user', 
        avatar: user.avatar, 
        status: user.status 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER portal: đăng nhập
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase(), role: 'user' });
    if (!user) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(user, 'user', 'user');
    await logAction(user.email, 'user', 'USER_LOGIN', { user: { id: user.id, email: user.email, displayName: user.displayName || user.name, role: user.role } }, req.ip, req.headers['user-agent']);
    res.json({ 
      success: true, 
      token, 
      user: { 
        _id: user._id.toString(),
        customId: user.customId || user.id,
        id: user.customId || user.id || user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role || 'user', 
        avatar: user.avatar, 
        status: user.status 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/user/me', auth, async (req, res) => {
  try {
    const realId = req.user._id || req.user.id;
    const [friendCount, postCount] = await Promise.all([
        Friendship.countDocuments({ $or: [{ requester: realId }, { recipient: realId }], status: 'accepted' }),
        Post.countDocuments({ userId: realId })
    ]);
    
    const userData = { ...req.user, friendCount, postCount };
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy thông tin rank của user (Unified endpoint)
router.get('/user/rank', auth, async (req, res) => {
  try {
    // Lấy bản ghi mới nhất từ DB để đảm bảo chính xác XP/Rank
    const accountData = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    }).lean();

    if (!accountData) return res.status(404).json({ success: false, message: 'User not found in DB' });

    const points = accountData.points || 0;
    const rankInfo = calculateRank(points);
    
    res.json({
      success: true,
      points: points,
      rank: accountData.rank || rankInfo.rank,
      rankTier: accountData.rankTier || rankInfo.tier,
      nextThreshold: rankInfo.nextThreshold || null,
      claimedQuests: accountData.claimedQuests || [],
      avatar: accountData.avatar || '',
      displayName: accountData.displayName || accountData.name || 'Thành viên',
      name: accountData.name || '',
      email: accountData.email || '',
      customId: accountData.customId || accountData.id,
      preferences: accountData.preferences || {}
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy log hoạt động (để tính toán quest)
router.get('/user/activity', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, activityLog: user.activityLog || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cộng XP cho user (Duplicate logic removed, use the one at the end of file)


// BUSINESS portal: đăng ký/đăng nhập/me
router.post('/business/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    // Bỏ check trùng lặp để 1 email tạo nhiều tài khoản
    let account = new BusinessAccount({
      customId: generateCustomId('business'),
      name,
      displayName: name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      status: 'active'
    });
    await account.save();
    await logAction(account.email, 'business', 'BUSINESS_REGISTER', { email: account.email, id: account._id }, req.ip, req.headers['user-agent']);
    const token = signPortalToken(account, 'business', 'business');
    res.json({ 
      success: true, 
      token, 
      user: { 
        _id: account._id.toString(),
        customId: account.customId || account.id,
        id: account.id, 
        email: account.email, 
        name: account.name, 
        role: 'business', 
        status: account.status, 
        avatar: account.avatar 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/business/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginStr = String(email || '').trim().toLowerCase();
    const accounts = await BusinessAccount.find({
      $or: [
        { email: loginStr },
        { customId: loginStr }
      ]
    });
    if (!accounts || accounts.length === 0) return res.status(400).json({ success: false, message: 'Email/Mã doanh nghiệp hoặc mật khẩu không đúng' });
    
    let matchedAccount = null;
    for (const acc of accounts) {
      const isMatch = await bcrypt.compare(password, acc.password);
      // console.log(`[AUTH DEBUG] Password match for ${acc.email}: ${isMatch}`);
      if (isMatch) {
        if (acc.status === 'suspended') {
          return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
        }
        matchedAccount = acc;
        break;
      }
    }
    
    if (!matchedAccount) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(matchedAccount, 'business', 'business');
    await logAction(matchedAccount.email, 'business', 'BUSINESS_LOGIN', { email: matchedAccount.email, id: matchedAccount._id }, req.ip, req.headers['user-agent']);
    res.json({ 
      success: true, 
      token, 
      user: { 
        _id: matchedAccount._id.toString(),
        customId: matchedAccount.customId || matchedAccount.id,
        id: matchedAccount.id, 
        email: matchedAccount.email, 
        name: matchedAccount.name, 
        role: 'business', 
        status: matchedAccount.status, 
        avatar: matchedAccount.avatar 
      } 
    });
  } catch (err) {
    require('fs').writeFileSync(require('path').join(__dirname, '../../scratch/login_error.txt'), err.stack || err.message);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

router.get('/business/me', businessAuth, async (req, res) => {
  try {
    const account = await BusinessAccount.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    }).select('-password');
    if (!account) return res.status(404).json({ success: false, message: 'Tài khoản doanh nghiệp không tồn tại' });
    res.json({ success: true, user: { ...account.toObject(), role: 'business' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN portal: đăng ký/đăng nhập/me
router.post('/admin/register', async (_req, res) => {
  return res.status(403).json({ success: false, message: 'Vui lòng dùng chức năng tạo Admin từ dashboard Super Admin' });
});

router.post('/admin/create', adminTokenAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được tạo tài khoản admin mới' });
    }
    const { name, email, password, permissions } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    let account = await AdminAccount.findOne({ email: normalizedEmail });
    if (account) return res.status(400).json({ success: false, message: 'Email admin đã tồn tại' });
    account = new AdminAccount({
      customId: generateCustomId('admin'),
      name,
      displayName: name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
      permissions: permissions || ['overview']
    });
    await account.save();
    await logAction(req.user.email, req.user.role, 'ADMIN_CREATED', { newAdminEmail: account.email }, req.ip, req.headers['user-agent']);
    res.json({ success: true, user: { id: account.id, email: account.email, name: account.name, role: account.role, status: account.status, avatar: account.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { email, password } = req.body;
    const account = await AdminAccount.findOne({ email: String(email || '').toLowerCase() });
    if (!account) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    if (account.status === 'suspended') return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(account, 'admin', account.role);
    await logAction(account.email, account.role, 'ADMIN_LOGIN', { email: account.email, role: account.role }, req.ip, req.headers['user-agent']);
    res.json({ success: true, token, user: { id: account.id, email: account.email, name: account.name, role: account.role, status: account.status, avatar: account.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh sách toàn bộ Admin (cho Super Admin)
router.get('/admin/list', adminTokenAuth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const admins = await AdminAccount.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/me', adminTokenAuth, async (req, res) => {
  try {
    const account = await AdminAccount.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    }).select('-password');
    if (!account) return res.status(404).json({ success: false, message: 'Tài khoản admin không tồn tại' });
    res.json({ success: true, user: { ...account.toObject(), role: account.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Backward compatibility endpoints
router.post('/register', (req, res, next) => {
  req.url = '/user/register';
  next();
});
router.post('/login', (req, res, next) => {
  req.url = '/user/login';
  next();
});
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    
    // Đảm bảo các trường rank có giá trị mặc định
    if (!user.rank) user.rank = 'Đồng';
    if (!user.rankTier) user.rankTier = 'I';
    if (!user.points) user.points = 0;
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cấu hình Rank/XP
const RANK_CONFIG = [
  { rank: 'Đồng', tier: 'I', min: 0 },
  { rank: 'Đồng', tier: 'II', min: 100 },
  { rank: 'Đồng', tier: 'III', min: 200 },
  { rank: 'Bạc', tier: 'I', min: 300 },
  { rank: 'Bạc', tier: 'II', min: 500 },
  { rank: 'Bạc', tier: 'III', min: 700 },
  { rank: 'Vàng', tier: 'I', min: 1000 },
  { rank: 'Vàng', tier: 'II', min: 1300 },
  { rank: 'Vàng', tier: 'III', min: 1600 },
  { rank: 'Bạch Kim', tier: 'I', min: 2000 },
  { rank: 'Bạch Kim', tier: 'II', min: 2400 },
  { rank: 'Bạch Kim', tier: 'III', min: 2800 },
  { rank: 'Kim Cương', tier: 'I', min: 3200 },
  { rank: 'Kim Cương', tier: 'II', min: 3700 },
  { rank: 'Kim Cương', tier: 'III', min: 4200 },
  { rank: 'Huyền Thoại', tier: '', min: 5000 }
];

function getRankDetails(points) {
  let current = RANK_CONFIG[0];
  let next = null;
  for (let i = 0; i < RANK_CONFIG.length; i++) {
    if (points >= RANK_CONFIG[i].min) {
      current = RANK_CONFIG[i];
      next = RANK_CONFIG[i+1] || null;
    } else {
      break;
    }
  }
  return { current, next };
}

// Legacy endpoint removed (Using unified one at line 200)

// Cộng XP và thăng hạng
router.post('/user/add-xp', auth, async (req, res) => {
  try {
    const { xp, questId, reason } = req.body;
    if (typeof xp !== 'number') return res.status(400).json({ success: false, message: 'XP invalid' });

    let user = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Tránh cộng trùng quest
    if (questId && user.claimedQuests.includes(questId)) {
      return res.status(400).json({ success: false, message: 'Quest already claimed' });
    }

    user.points = (user.points || 0) + xp;
    if (questId) user.claimedQuests.push(questId);

    // Tính toán lại hạng
    const { current } = getRankDetails(user.points);
    user.rank = current.rank;
    user.rankTier = current.tier;

    await user.save();
    
    // Invalidate session cache
    const portal = 'user';
    const cacheId = user.customId || user.id || user._id.toString();
    authCache.delete(`${portal}_${cacheId}`);
    authCache.delete(`${portal}_${user._id.toString()}`);
    
    // Invalidate leaderboard cache
    lastLeaderboardCache = 0;
    
    // Log hoạt động
    await logAction(user.email, user.role, 'USER_XP_ADDED', { xp, questId, reason, newPoints: user.points }, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      points: user.points,
      rank: user.rank,
      rankTier: user.rankTier,
      message: `Đã cộng ${xp} XP! Hạng hiện tại: ${user.rank} ${user.rankTier}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cập nhật hồ sơ (Hỗ trợ User, Business, Admin)
router.put('/profile', sharedAuth, async (req, res) => {
  try {
    const { displayName, notes, avatar, cover, phone, preferences } = req.body;
    
    // Select model based on portal
    const modelMap = { 'user': User, 'business': BusinessAccount, 'admin': AdminAccount };
    const Model = modelMap[req.user.portal] || User;

    const searchId = req.user._id || req.user.id;
    let account = await Model.findOne({
        $or: [
            { _id: mongoose.Types.ObjectId.isValid(searchId) ? searchId : undefined },
            { customId: req.user.id },
            { id: req.user.id }
        ].filter(q => q._id !== undefined || q.customId !== undefined || q.id !== undefined)
    });

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    
    // Explicitly set each field
    if (displayName !== undefined) {
        account.displayName = displayName;
        // Also update name if it was the same as displayName (syncing)
        if (account.portal === 'business' || account.portal === 'admin') {
            account.name = displayName;
        }
    }
    if (notes !== undefined) account.notes = notes;
    if (avatar !== undefined) account.avatar = avatar;
    if (cover !== undefined) account.cover = cover;
    if (phone !== undefined) account.phone = phone;
    if (preferences !== undefined) {
        console.log(`[ProfileUpdate] Updating preferences for ${account.email}:`, preferences);
        account.preferences = { ...account.preferences, ...preferences };
        account.markModified('preferences');
    }

    await account.save();
    console.log(`[ProfileUpdate] Successfully saved to DB for ${account.email}`);
    
    // Clear cache
    const possibleIds = [req.user.id, req.user._id, account.customId, account.id, account._id.toString()];
    possibleIds.forEach(id => {
      if (id) clearAuthCache(id, req.user.portal);
    });

    await logAction(account.email, account.role, `${req.user.portal.toUpperCase()}_PROFILE_UPDATED`, { changed: Object.keys(req.body) }, req.ip, req.headers['user-agent']);
    res.json({ success: true, user: { ...account.toObject(), role: account.role, portal: req.user.portal } });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Đổi mật khẩu (Hỗ trợ User, Business, Admin)
router.put('/password', sharedAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu' });
    }
    
    const modelMap = { 'user': User, 'business': BusinessAccount, 'admin': AdminAccount };
    const Model = modelMap[req.user.portal] || User;

    let account = await Model.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    
    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch && oldPassword !== account.password) { 
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    }

    // Mã hóa và lưu mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();
    await logAction(account.email, account.role, `${req.user.portal.toUpperCase()}_PASSWORD_CHANGED`, {}, req.ip, req.headers['user-agent']);
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Password update error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cache for leaderboard
let cachedLeaderboard = null;
let lastLeaderboardCache = 0;
const LB_CACHE_TTL = 1 * 60 * 1000; // 1 minute

// Lấy bảng xếp hạng người dùng
router.get('/leaderboard', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedLeaderboard && (now - lastLeaderboardCache < LB_CACHE_TTL)) {
      return res.json({ success: true, leaderboard: cachedLeaderboard });
    }

    const leaderboard = await User.find({ role: 'user' })
      .select('name displayName avatar points rank rankTier')
      .sort({ points: -1 })
      .limit(100)
      .lean();
      
    cachedLeaderboard = leaderboard;
    lastLeaderboardCache = now;
    
    res.setHeader('Cache-Control', 'no-cache');
    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tải bảng xếp hạng' });
  }
});

// Thống kê hoạt động cá nhân chính xác
router.get('/user/stats', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const PlaceReview = mongoose.models.PlaceReview || require('../models/PlaceReview');
    const Booking = mongoose.models.Booking || require('../models/Booking');
    const UserActivity = mongoose.models.UserActivity || require('../models/UserActivity');
    const VoucherUsage = mongoose.models.VoucherUsage || require('../models/VoucherUsage');

    const itineraries = await Itinerary.find({ userId: req.user.id, isDeleted: false });
    
    const userIdsToMatch = [req.user.id];
    if (user.customId) userIdsToMatch.push(user.customId);
    if (user.id) userIdsToMatch.push(user.id);
    if (user._id) userIdsToMatch.push(user._id.toString());
    
    // Đếm tin nhắn chatbot (userId trong Conversation là string)
    // Hoặc có thể đếm số phiên (sessionId) duy nhất
    const messageCount = await Conversation.distinct('sessionId', { userId: { $in: userIdsToMatch } }).then(res => res.length);

    // Phân bổ vùng miền từ hành trình
    const regionMap = {};
    itineraries.forEach(itin => {
      const parts = itin.destination.split(',');
      const reg = parts[parts.length - 1].trim();
      regionMap[reg] = (regionMap[reg] || 0) + 1;
    });

    // Phân bổ trạng thái hành trình
    const statusMap = { planning: 0, completed: 0, missed: 0 };
    itineraries.forEach(itin => {
      if (statusMap.hasOwnProperty(itin.status)) statusMap[itin.status]++;
    });

    // Tần suất hoạt động (7 ngày gần nhất) & xu hướng chi tiêu
    const activityDays = [0, 0, 0, 0, 0, 0, 0];
    const spendingDays = [0, 0, 0, 0, 0, 0, 0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    itineraries.filter(i => i.createdAt >= weekAgo).forEach(i => {
      const day = (new Date(i.createdAt).getDay() + 6) % 7;
      activityDays[day]++;
    });

    const realId = req.user._id || req.user.id;
    let userIdObj = null;
    if (mongoose.Types.ObjectId.isValid(realId)) {
      userIdObj = new mongoose.Types.ObjectId(realId);
    }

    // Thống kê social
    const [friendCount, postCount, posts, reviewsCount, bookingsCount, allBookings, userActivities] = await Promise.all([
      userIdObj ? Friendship.countDocuments({ $or: [{ requester: userIdObj }, { recipient: userIdObj }], status: 'accepted' }) : Promise.resolve(0),
      userIdObj ? Post.countDocuments({ userId: userIdObj }) : Promise.resolve(0),
      userIdObj ? Post.find({ userId: userIdObj }).select('likes').lean() : Promise.resolve([]),
      PlaceReview.countDocuments({ userId: req.user.id }),
      Booking.countDocuments({ userId: req.user.id }),
      Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(),
      UserActivity.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(15).lean()
    ]);

    const recentBookings = allBookings.slice(0, 15);
    const totalLikes = (posts || []).reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0);

    // ── Smart & Financial Stats ──────────────────────
    // 1. Số ngày hoạt động kể từ khi đăng ký
    const daysSinceJoined = user.createdAt
      ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    // 2. Số nhiệm vụ đã hoàn thành
    const questsCompleted = (user.claimedQuests || []).length;

    // 3. Phân tích tài chính & hoạt động theo các phạm vi thời gian (7d, 30d, all-time)
    const formatDisplay = (val) => {
      if (val === 0) return '0 VNĐ';
      if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')} Tr VNĐ`;
      if (val >= 1000) return `${Math.round(val / 1000)}K VNĐ`;
      return `${val} VNĐ`;
    };

    // Tạo nhãn thời gian động cho trục biểu đồ
    const labels7 = [];
    const labels30 = [];
    const labelsAll = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels7.push(d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' }));
    }
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels30.push(d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' }));
    }
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labelsAll.push('Thg ' + (d.getMonth() + 1));
    }

    // Thiết lập mốc thời gian bắt đầu
    const start7 = new Date();
    start7.setDate(start7.getDate() - 6);
    start7.setHours(0,0,0,0);

    const start30 = new Date();
    start30.setDate(start30.getDate() - 29);
    start30.setHours(0,0,0,0);

    const startAll = new Date();
    startAll.setMonth(startAll.getMonth() - 5);
    startAll.setDate(1);
    startAll.setHours(0,0,0,0);

    const tfData = {
      '7': {
        spent: 0, savings: 0, bookingsCount: 0,
        spendingTrend: new Array(7).fill(0),
        activityTrend: new Array(7).fill(0),
        categories: { stay: 0, dining: 0, tour: 0, rental: 0, other: 0 },
        regions: {},
        completedTrips: 0, totalTrips: 0
      },
      '30': {
        spent: 0, savings: 0, bookingsCount: 0,
        spendingTrend: new Array(30).fill(0),
        activityTrend: new Array(30).fill(0),
        categories: { stay: 0, dining: 0, tour: 0, rental: 0, other: 0 },
        regions: {},
        completedTrips: 0, totalTrips: 0
      },
      'all': {
        spent: 0, savings: 0, bookingsCount: 0,
        spendingTrend: new Array(6).fill(0),
        activityTrend: new Array(6).fill(0),
        categories: { stay: 0, dining: 0, tour: 0, rental: 0, other: 0 },
        regions: {},
        completedTrips: 0, totalTrips: 0
      }
    };

    const reqMonth = req.query.month ? parseInt(req.query.month) : null;
    let monthStartDate, monthEndDate, monthDays;
    let labelsMonth = [];
    if (reqMonth >= 1 && reqMonth <= 12) {
      const year = new Date().getFullYear();
      monthStartDate = new Date(year, reqMonth - 1, 1, 0, 0, 0, 0);
      monthEndDate = new Date(year, reqMonth, 0, 23, 59, 59, 999);
      monthDays = monthEndDate.getDate();
      for (let i = 1; i <= monthDays; i++) {
        labelsMonth.push(`${i}/${reqMonth}`);
      }
      tfData['month'] = {
        spent: 0, savings: 0, bookingsCount: 0,
        spendingTrend: new Array(monthDays).fill(0),
        activityTrend: new Array(monthDays).fill(0),
        categories: { stay: 0, dining: 0, tour: 0, rental: 0, other: 0 },
        regions: {},
        completedTrips: 0, totalTrips: 0
      };
    }

    // Duyệt đặt dịch vụ
    allBookings.forEach(bk => {
      const bkDate = new Date(bk.createdAt || Date.now());
      const isPaid = bk.status !== 'cancelled';

      if (isPaid) {
        // All-time grouping (theo tháng)
        if (bkDate >= startAll) {
          const diffMonths = (bkDate.getFullYear() - startAll.getFullYear()) * 12 + (bkDate.getMonth() - startAll.getMonth());
          if (diffMonths >= 0 && diffMonths < 6) {
            tfData['all'].spendingTrend[diffMonths] += (bk.totalPrice || 0);
          }
        }
        tfData['all'].spent += (bk.totalPrice || 0);
        tfData['all'].savings += (bk.discountAmount || 0);
        tfData['all'].bookingsCount++;
        const cat = bk.businessCategory || 'other';
        const targetCat = tfData['all'].categories.hasOwnProperty(cat) ? cat : 'other';
        tfData['all'].categories[targetCat] += (bk.totalPrice || 0);

        // Last 30 days
        if (bkDate >= start30) {
          const diffDays = Math.floor((bkDate - start30) / (24 * 3600 * 1000));
          if (diffDays >= 0 && diffDays < 30) {
            tfData['30'].spendingTrend[diffDays] += (bk.totalPrice || 0);
          }
          tfData['30'].spent += (bk.totalPrice || 0);
          tfData['30'].savings += (bk.discountAmount || 0);
          tfData['30'].bookingsCount++;
          tfData['30'].categories[tfData['30'].categories.hasOwnProperty(cat) ? cat : 'other'] += (bk.totalPrice || 0);
        }

        // Last 7 days
        if (bkDate >= start7) {
          const diffDays = Math.floor((bkDate - start7) / (24 * 3600 * 1000));
          if (diffDays >= 0 && diffDays < 7) {
            tfData['7'].spendingTrend[diffDays] += (bk.totalPrice || 0);
          }
          tfData['7'].spent += (bk.totalPrice || 0);
          tfData['7'].savings += (bk.discountAmount || 0);
          tfData['7'].bookingsCount++;
          tfData['7'].categories[tfData['7'].categories.hasOwnProperty(cat) ? cat : 'other'] += (bk.totalPrice || 0);
        }

        // Month-specific
        if (tfData['month'] && bkDate >= monthStartDate && bkDate <= monthEndDate) {
          const dayOfMonth = bkDate.getDate() - 1;
          if (dayOfMonth >= 0 && dayOfMonth < monthDays) {
            tfData['month'].spendingTrend[dayOfMonth] += (bk.totalPrice || 0);
          }
          tfData['month'].spent += (bk.totalPrice || 0);
          tfData['month'].savings += (bk.discountAmount || 0);
          tfData['month'].bookingsCount++;
          tfData['month'].categories[tfData['month'].categories.hasOwnProperty(cat) ? cat : 'other'] += (bk.totalPrice || 0);
        }
      }
    });

    // Duyệt hành trình
    itineraries.forEach(itin => {
      const itinDate = new Date(itin.createdAt || Date.now());
      const isCompleted = itin.status === 'completed';
      const destParts = itin.destination ? itin.destination.split(',') : [];
      const reg = destParts.length ? destParts[destParts.length - 1].trim() : 'Khác';

      // All-time (theo tháng)
      if (itinDate >= startAll) {
        const diffMonths = (itinDate.getFullYear() - startAll.getFullYear()) * 12 + (itinDate.getMonth() - startAll.getMonth());
        if (diffMonths >= 0 && diffMonths < 6) {
          tfData['all'].activityTrend[diffMonths]++;
        }
      }
      tfData['all'].totalTrips++;
      if (isCompleted) tfData['all'].completedTrips++;
      tfData['all'].regions[reg] = (tfData['all'].regions[reg] || 0) + 1;

      // Last 30 days
      if (itinDate >= start30) {
        const diffDays = Math.floor((itinDate - start30) / (24 * 3600 * 1000));
        if (diffDays >= 0 && diffDays < 30) {
          tfData['30'].activityTrend[diffDays]++;
        }
        tfData['30'].totalTrips++;
        if (isCompleted) tfData['30'].completedTrips++;
        tfData['30'].regions[reg] = (tfData['30'].regions[reg] || 0) + 1;
      }

      // Last 7 days
      if (itinDate >= start7) {
        const diffDays = Math.floor((itinDate - start7) / (24 * 3600 * 1000));
        if (diffDays >= 0 && diffDays < 7) {
          tfData['7'].activityTrend[diffDays]++;
        }
        tfData['7'].totalTrips++;
        if (isCompleted) tfData['7'].completedTrips++;
        tfData['7'].regions[reg] = (tfData['7'].regions[reg] || 0) + 1;
      }

      // Month-specific
      if (tfData['month'] && itinDate >= monthStartDate && itinDate <= monthEndDate) {
        const dayOfMonth = itinDate.getDate() - 1;
        if (dayOfMonth >= 0 && dayOfMonth < monthDays) {
          tfData['month'].activityTrend[dayOfMonth]++;
        }
        tfData['month'].totalTrips++;
        if (isCompleted) tfData['month'].completedTrips++;
        tfData['month'].regions[reg] = (tfData['month'].regions[reg] || 0) + 1;
      }
    });

    // Tiết kiệm qua voucher bổ sung từ VoucherUsage
    let totalSavings = tfData['all'].savings;
    try {
      const usages = await VoucherUsage.find({ userId: req.user.id }).select('discountAmount').lean();
      const voucherSavings = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
      totalSavings = Math.max(totalSavings, voucherSavings);
      tfData['all'].savings = totalSavings;
    } catch (e) { /* VoucherUsage error fallback */ }

    // 4. Chỉ số phát triển bền vững (ESG - quy đổi khí thải)
    const carbonKg = Math.round((itineraries.length * 2.4 + tfData['all'].completedTrips * 1.6) * 10) / 10;
    const carbonDisplay = carbonKg > 0 ? `${carbonKg} kg CO₂` : '0 kg CO₂';

    // 5. Cấp độ thành viên doanh nghiệp & tiến trình XP
    const userPoints = user.points || 0;
    const currentLevel = Math.floor(userPoints / 1000) + 1;
    const xpInLevel = userPoints % 1000;
    const xpProgress = Math.round((xpInLevel / 1000) * 100);

    // 6. Xây dựng cấu trúc dữ liệu theo timeframe
    const timeframes = {};
    const tfKeys = ['7', '30', 'all'];
    if (tfData['month']) {
      tfKeys.push('month');
    }
    tfKeys.forEach(tf => {
      const data = tfData[tf];
      
      const tfCarbonKg = Math.round((data.totalTrips * 2.4 + data.completedTrips * 1.6) * 10) / 10;
      const tfCarbonDisplay = tfCarbonKg > 0 ? `${tfCarbonKg} kg CO₂` : '0 kg CO₂';
      
      const tfCompletionRate = data.totalTrips > 0
        ? Math.round((data.completedTrips / data.totalTrips) * 1000) / 10
        : 0;

      timeframes[tf] = {
        summary: {
          totalSpent: formatDisplay(data.spent),
          savings: formatDisplay(data.savings),
          carbon: tfCarbonDisplay,
          completionRate: tfCompletionRate + '%',
          trips: data.totalTrips,
          bookingsCount: data.bookingsCount,
          activeDays: daysSinceJoined,
          quests: questsCompleted,
          reviewsCount: reviewsCount,
          friends: friendCount,
          posts: postCount,
          messages: messageCount,
          level: currentLevel,
          levelProgress: xpProgress,
          rank: (user.rank || 'Khám phá') + ' ' + (user.rankTier || '')
        },
        charts: {
          labels: tf === '7' ? labels7 : (tf === '30' ? labels30 : (tf === 'month' ? labelsMonth : labelsAll)),
          spendingTrend: data.spendingTrend,
          activity: data.activityTrend,
          categoryBreakdown: data.categories,
          regions: data.regions,
          radar: [
            70 + (data.totalTrips * 5) + (postCount * 2),
            60 + (userPoints / 100),
            50 + (messageCount / 10),
            80 + (friendCount * 3),
            90,
            50 + (totalLikes / 10)
          ].map(v => Math.min(v, 100))
        }
      };
    });

    // 7. Xác định tình trạng huy hiệu / thành tích
    const badges = {
      explorer: { unlocked: itineraries.length > 0, progress: Math.min(itineraries.length * 20, 100), label: 'Nhà Thám Hiểm', desc: 'Đã tạo ít nhất 1 lộ trình du lịch.' },
      creator: { unlocked: postCount > 0, progress: Math.min(postCount * 33.3, 100), label: 'Cây Bút Trẻ', desc: 'Đã đăng bài viết trên cộng đồng.' },
      aiFriend: { unlocked: messageCount >= 5, progress: Math.min((messageCount / 5) * 100, 100), label: 'Chiến Thần AI', desc: 'Tương tác trợ lý AI từ 5 lần trở lên.' },
      critic: { unlocked: reviewsCount > 0, progress: Math.min(reviewsCount * 50, 100), label: 'Nhà Phê Bình', desc: 'Đăng đánh giá chất lượng về địa điểm.' },
      vip: { unlocked: bookingsCount > 0 || tfData['all'].spent > 0, progress: Math.min(bookingsCount * 50, 100), label: 'Lữ Khách VIP', desc: 'Sử dụng dịch vụ hoặc đặt tour thành công.' },
      eco: { unlocked: carbonKg >= 4, progress: Math.min((carbonKg / 4) * 100, 100), label: 'Đại Sứ Xanh', desc: 'Tiết kiệm phát thải carbon từ 4kg CO₂.' }
    };

    // DEMO DATA FALLBACK cho người dùng mới hoàn toàn
    const isNewUser = itineraries.length === 0 && (user.favorites || []).length === 0 && messageCount === 0 && postCount === 0 && bookingsCount === 0;

    let summary = timeframes['all'].summary;
    let charts = timeframes['all'].charts;

    let bookingsList = recentBookings;
    let activitiesList = userActivities;

    if (isNewUser) {
      summary = {
        trips: 12, favorites: 24, messages: 156, posts: 8,
        likes: 42, friends: 15, exp: 1250, rank: 'Vàng I',
        activeDays: 45, quests: 8,
        savings: '1.2 Tr VNĐ', carbon: '28.8 kg CO₂',
        reviewsCount: 14, bookingsCount: 18,
        totalSpent: '12.4 Tr VNĐ', completionRate: '83.3%',
        carbonKg: 28.8, level: 2, levelProgress: 25
      };
      charts = {
        activity: [18, 22, 15, 32, 25, 12],
        spendingTrend: [1800000, 2200000, 1500000, 3200000, 2500000, 1200000],
        regions: { 'Hà Nội': 5, 'TP.HCM': 3, 'Đà Nẵng': 2, 'Sapa': 2 },
        status: { planning: 4, completed: 8, missed: 0 },
        interests: ['Văn hóa', 'Ẩm thực', 'Biển', 'Núi'],
        categoryBreakdown: { stay: 6500000, dining: 1800000, tour: 3100000, rental: 1000000, other: 0 },
        radar: [85, 70, 90, 65, 80, 75]
      };
      
      // Fallback timeframes
      timeframes['7'] = {
        summary: {
          totalSpent: '3.1 Tr VNĐ', savings: '450K VNĐ', carbon: '8.5 kg CO₂',
          completionRate: '100%', trips: 3, bookingsCount: 4, activeDays: 45, quests: 8, reviewsCount: 14,
          level: 2, levelProgress: 25, rank: 'Vàng I'
        },
        charts: {
          labels: labels7,
          spendingTrend: [450000, 850000, 0, 1200000, 600000, 0, 0],
          activity: [1, 2, 0, 1, 1, 0, 0],
          categoryBreakdown: { stay: 2000000, dining: 500000, tour: 600000, rental: 0, other: 0 },
          regions: { 'Hà Nội': 2, 'Sapa': 1 },
          radar: [85, 70, 90, 65, 80, 75]
        }
      };
      timeframes['30'] = {
        summary: {
          totalSpent: '12.4 Tr VNĐ', savings: '1.2 Tr VNĐ', carbon: '28.8 kg CO₂',
          completionRate: '83.3%', trips: 12, bookingsCount: 18, activeDays: 45, quests: 8, reviewsCount: 14,
          level: 2, levelProgress: 25, rank: 'Vàng I'
        },
        charts: {
          labels: labels30,
          spendingTrend: [
            350000, 450000, 0, 600000, 1200000, 0, 0,
            850000, 450000, 1500000, 950000, 0, 1800000, 0,
            300000, 0, 750000, 0, 1100000, 0, 500000,
            0, 0, 600000, 0, 900000, 0, 0, 0, 0
          ],
          activity: [
            1, 0, 0, 1, 2, 0, 0,
            1, 0, 1, 1, 0, 1, 0,
            0, 0, 1, 0, 1, 0, 1,
            0, 0, 1, 0, 1, 0, 0, 0, 0
          ],
          categoryBreakdown: { stay: 6500000, dining: 1800000, tour: 3100000, rental: 1000000, other: 0 },
          regions: { 'Hà Nội': 5, 'TP.HCM': 3, 'Đà Nẵng': 2, 'Sapa': 2 },
          radar: [85, 70, 90, 65, 80, 75]
        }
      };
      timeframes['all'] = {
        summary: {
          totalSpent: '12.4 Tr VNĐ', savings: '1.2 Tr VNĐ', carbon: '28.8 kg CO₂',
          completionRate: '83.3%', trips: 12, bookingsCount: 18, activeDays: 45, quests: 8, reviewsCount: 14,
          level: 2, levelProgress: 25, rank: 'Vàng I'
        },
        charts: {
          labels: labelsAll,
          spendingTrend: [1800000, 2200000, 1500000, 3200000, 2500000, 1200000],
          activity: [2, 3, 1, 4, 1, 1],
          categoryBreakdown: { stay: 6500000, dining: 1800000, tour: 3100000, rental: 1000000, other: 0 },
          regions: { 'Hà Nội': 5, 'TP.HCM': 3, 'Đà Nẵng': 2, 'Sapa': 2 },
          radar: [85, 70, 90, 65, 80, 75]
        }
      };

      if (tfData['month']) {
        const dummySpending = new Array(monthDays).fill(0);
        const dummyActivity = new Array(monthDays).fill(0);
        for (let i = 0; i < monthDays; i++) {
          if (i % 4 === 0) {
            dummySpending[i] = 300000 + (i * 25000) % 600000;
            dummyActivity[i] = 1;
          } else if (i % 7 === 0) {
            dummySpending[i] = 750000 + (i * 15000) % 900000;
            dummyActivity[i] = 2;
          }
        }
        timeframes['month'] = {
          summary: {
            totalSpent: '4.2 Tr VNĐ', savings: '550K VNĐ', carbon: '10.8 kg CO₂',
            completionRate: '80%', trips: 4, bookingsCount: 5, activeDays: daysSinceJoined, quests: questsCompleted, reviewsCount: reviewsCount,
            level: currentLevel, levelProgress: xpProgress, rank: (user.rank || 'Khám phá') + ' ' + (user.rankTier || '')
          },
          charts: {
            labels: labelsMonth,
            spendingTrend: dummySpending,
            activity: dummyActivity,
            categoryBreakdown: { stay: 3000000, dining: 700000, tour: 500000, rental: 0, other: 0 },
            regions: { 'Hà Nội': 3, 'Sapa': 1 },
            radar: [85, 70, 90, 65, 80, 75]
          }
        };
      }

      bookingsList = [
        { bookingId: 'BK-982130', placeName: 'Khách Sạn Mường Thanh Sapa', businessCategory: 'stay', useDate: new Date(Date.now() - 2 * 24 * 3600 * 1000), totalPrice: 3200000, paymentStatus: 'paid', status: 'completed' },
        { bookingId: 'BK-761923', placeName: 'Nhà Hàng Cơm Niêu Đà Nẵng', businessCategory: 'dining', useDate: new Date(Date.now() - 5 * 24 * 3600 * 1000), totalPrice: 850000, paymentStatus: 'paid', status: 'completed' },
        { bookingId: 'BK-552190', placeName: 'Tour Ngũ Hành Sơn - Hội An', businessCategory: 'tour', useDate: new Date(Date.now() - 10 * 24 * 3600 * 1000), totalPrice: 1500000, paymentStatus: 'paid', status: 'completed' },
        { bookingId: 'BK-441239', placeName: 'Thuê Xe Máy Tự Lái Đà Nẵng', businessCategory: 'rental', useDate: new Date(Date.now() - 12 * 24 * 3600 * 1000), totalPrice: 450000, paymentStatus: 'paid', status: 'completed' },
        { bookingId: 'BK-213904', placeName: 'Cáp Treo Bà Nà Hills', businessCategory: 'facility', useDate: new Date(Date.now() - 15 * 24 * 3600 * 1000), totalPrice: 1800000, paymentStatus: 'paid', status: 'completed' }
      ];
      activitiesList = [
        { type: 'booking', description: 'Đặt thành công dịch vụ tại Khách Sạn Mường Thanh Sapa (Mã: BK-982130)', ip: '192.168.1.15', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
        { type: 'itinerary_gen', description: 'Hệ thống AI lập lộ trình du lịch Đà Nẵng - Hội An 3 ngày 2 đêm', ip: '192.168.1.15', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { type: 'review', description: 'Viết đánh giá 5 sao cho Nhà Hàng Cơm Niêu Đà Nẵng', ip: '115.79.132.4', userAgent: 'Chrome/125.0.0.0 (Windows)', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
        { type: 'search', description: 'Tìm kiếm địa điểm: "Địa điểm checkin đẹp ở Sapa"', ip: '115.79.132.4', userAgent: 'Chrome/125.0.0.0 (Windows)', timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000) },
        { type: 'social_post', description: 'Đăng bài viết mới trên cộng đồng WanderViet: "Chuyến đi Sapa đáng nhớ!"', ip: '115.79.132.4', userAgent: 'Chrome/125.0.0.0 (Windows)', timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
      ];
    }

    res.json({ success: true, summary, charts, timeframes, bookings: bookingsList, activities: activitiesList, badges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đồng bộ danh sách yêu thích
router.post('/user/sync-favorites', auth, async (req, res) => {
  try {
    const { favorites } = req.body; // Mảng các ID địa điểm mới
    if (!Array.isArray(favorites)) return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    
    const user = await User.findOne({
      $or: [
        { customId: req.user.id },
        { id: req.user.id },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ _id: req.user.id }] : [])
      ]
    });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    
    const oldFavs = user.favorites || [];
    const added = favorites.filter(x => !oldFavs.includes(x));
    const removed = oldFavs.filter(x => !favorites.includes(x));

    user.favorites = favorites;
    await user.save();

    // Cập nhật favoritesCount cho Place (không dùng await trong loop để nhanh hơn, hoặc dùng bulk write)
    if (added.length > 0) {
      await Place.updateMany({ id: { $in: added } }, { $inc: { favoritesCount: 1 } });
    }
    if (removed.length > 0) {
      await Place.updateMany({ id: { $in: removed } }, { $inc: { favoritesCount: -1 } });
      // Đảm bảo không âm
      await Place.updateMany({ id: { $in: removed }, favoritesCount: { $lt: 0 } }, { $set: { favoritesCount: 0 } });
    }

    res.json({ success: true, count: user.favorites.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// QUÊN MẬT KHẨU (Gửi Email)
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, portal } = req.body; // portal: 'user', 'business', 'admin'
    const Model = portal === 'business' ? BusinessAccount : (portal === 'admin' ? AdminAccount : User);
    
    const account = await Model.findOne({ email: String(email).toLowerCase() });
    if (!account) return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống' });

    // Tạo token
    const token = crypto.randomBytes(20).toString('hex');
    account.resetPasswordToken = token;
    account.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
    await account.save();

    // Gửi email (Simulation/Real)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${token}&portal=${portal}`;
    const mailOptions = {
      to: account.email,
      from: process.env.EMAIL_USER,
      subject: 'Đặt lại mật khẩu WanderViet AI',
      text: `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.\n\n` +
            `Vui lòng nhấp vào liên kết sau hoặc dán vào trình duyệt của bạn để hoàn tất quá trình:\n\n` +
            `${resetUrl}\n\n` +
            `Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.' });
    } catch (mailErr) {
      console.error('Lỗi gửi mail:', mailErr);
      // Trả về token trong response để DEV có thể test nếu mail server chưa config xong
      res.json({ success: true, message: 'Email server đang bảo trì. Token test: ' + token, token });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ĐẶT LẠI MẬT KHẨU MỚI
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, portal } = req.body;
    const Model = portal === 'business' ? BusinessAccount : (portal === 'admin' ? AdminAccount : User);

    const account = await Model.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!account) return res.status(400).json({ success: false, message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });

    // Cập nhật mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(password, salt);
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    res.json({ success: true, message: 'Mật khẩu của bạn đã được cập nhật thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// EMAIL OTP AUTHENTICATION & PASSWORD RECOVERY
// ==========================================

router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose, portal } = req.body;
    if (!email || !purpose || !portal) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (email, purpose, portal)' });
    }
    
    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Định dạng email không hợp lệ.' });
    }

    const Model = portal === 'business' ? BusinessAccount : (portal === 'admin' ? AdminAccount : User);

    // Validation based on purpose
    if (purpose === 'register') {
      const exists = await Model.findOne({ email: normalizedEmail });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email này đã được đăng ký tài khoản.' });
      }
    } else if (purpose === 'forgot_password') {
      const exists = await Model.findOne({ email: normalizedEmail });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký trong hệ thống.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Mục đích (purpose) xác thực không hợp lệ.' });
    }

    // Cooldown & Rate limit checks (Skip in development for friction-free testing)
    if (process.env.NODE_ENV === 'production') {
      // Cooldown check (60 seconds)
      const sixtySecsAgo = new Date(Date.now() - 60 * 1000);
      const recentOtp = await OtpVerification.findOne({
        email: normalizedEmail,
        purpose,
        portal,
        createdAt: { $gte: sixtySecsAgo }
      });
      if (recentOtp) {
        const waitSecs = Math.max(0, Math.ceil((60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000));
        return res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${waitSecs} giây trước khi yêu cầu mã OTP tiếp theo.`
        });
      }

      // Hourly Rate limit check (5 requests/hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const hourOtpCount = await OtpVerification.countDocuments({
        email: normalizedEmail,
        purpose,
        portal,
        createdAt: { $gte: oneHourAgo }
      });
      if (hourOtpCount >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Bạn đã vượt quá giới hạn yêu cầu OTP (tối đa 5 lần/giờ). Vui lòng thử lại sau.'
        });
      }
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    // Save to DB (expires in 5 mins)
    const otpDoc = new OtpVerification({
      email: normalizedEmail,
      otp,
      purpose,
      portal,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await otpDoc.save();

    // Send email
    try {
      await sendOtpEmail(normalizedEmail, otp, purpose);
      const resp = { 
        success: true, 
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' 
      };
      if (process.env.NODE_ENV !== 'production') {
        resp.otp = otp;
      }
      return res.json(resp);
    } catch (mailErr) {
      console.warn('[Nodemailer Fail] Could not send real email:', mailErr.message);
      // Fallback for easy dev testing: return OTP in response
      return res.json({
        success: true,
        message: `Email server đang bảo trì. Mã OTP test: ${otp}`,
        otp
      });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose, portal } = req.body;
    if (!email || !otp || !purpose || !portal) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (email, otp, purpose, portal)' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find valid OTP
    const otpRecord = await OtpVerification.findOne({
      email: normalizedEmail,
      purpose,
      portal,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' });
    }

    // Increment attempts
    otpRecord.attempts = (otpRecord.attempts || 0) + 1;
    await otpRecord.save();

    if (otpRecord.attempts > 5) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'Quá số lần thử cho phép. Vui lòng yêu cầu mã OTP mới.' });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác.' });
    }

    return res.json({ success: true, message: 'Mã OTP chính xác!' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống.' });
  }
});

router.post('/register-with-otp', async (req, res) => {
  try {
    const { name, email, password, otp, portal } = req.body;
    if (!name || !email || !password || !otp || !portal) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký hoặc mã OTP.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    
    // Verify OTP first
    const otpRecord = await OtpVerification.findOne({
      email: normalizedEmail,
      purpose: 'register',
      portal,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn.' });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác.' });
    }

    // Check email double allocation
    const Model = portal === 'business' ? BusinessAccount : User;
    const exists = await Model.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email đã được đăng ký tài khoản.' });
    }

    // Delete OTP document to prevent reuse
    await OtpVerification.deleteMany({ email: normalizedEmail, purpose: 'register', portal });

    // Create Account
    let account;
    if (portal === 'business') {
      account = new BusinessAccount({
        customId: generateCustomId('business'),
        name,
        displayName: name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        status: 'active',
        isVerified: true
      });
      await account.save();
      await logAction(account.email, 'business', 'BUSINESS_REGISTER', { email: account.email, id: account._id }, req.ip, req.headers['user-agent']);
    } else {
      account = new User({
        customId: generateCustomId('user'),
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        displayName: name,
        role: 'user',
        status: 'active',
        isVerified: true
      });
      await account.save();
      await logAction(account.email, 'user', 'USER_REGISTER', { user: { id: account.id, email: account.email, displayName: account.name, role: account.role } }, req.ip, req.headers['user-agent']);
    }

    const token = signPortalToken(account, portal, portal);
    return res.json({ 
      success: true, 
      token, 
      user: { 
        _id: account._id.toString(),
        customId: account.customId || account.id,
        id: account.customId || account.id || account._id.toString(), 
        email: account.email, 
        name: account.name, 
        role: portal, 
        avatar: account.avatar || '', 
        status: account.status 
      } 
    });
  } catch (err) {
    console.error('Register with OTP error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Đã xảy ra lỗi hệ thống.' });
  }
});

router.post('/reset-password-with-otp', async (req, res) => {
  try {
    const { email, otp, password, portal } = req.body;
    if (!email || !otp || !password || !portal) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin yêu cầu đặt lại mật khẩu.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Verify OTP first
    const otpRecord = await OtpVerification.findOne({
      email: normalizedEmail,
      purpose: 'forgot_password',
      portal,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn.' });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác.' });
    }

    // Delete OTP document to prevent reuse
    await OtpVerification.deleteMany({ email: normalizedEmail, purpose: 'forgot_password', portal });

    // Update password
    const Model = portal === 'business' ? BusinessAccount : (portal === 'admin' ? AdminAccount : User);
    const account = await Model.findOne({ email: normalizedEmail });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(password, salt);
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    await logAction(account.email, portal, 'RESET_PASSWORD_OTP', { email: account.email }, req.ip, req.headers['user-agent']);

    return res.json({ success: true, message: 'Mật khẩu của bạn đã được cập nhật thành công!' });
  } catch (err) {
    console.error('Reset password with OTP error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Đã xảy ra lỗi hệ thống.' });
  }
});

module.exports = { router, auth, businessAuth, adminTokenAuth, sharedAuth, verifyPortalToken, signPortalToken, generateCustomId };

