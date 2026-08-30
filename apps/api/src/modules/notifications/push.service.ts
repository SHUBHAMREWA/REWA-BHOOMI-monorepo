import webpush from 'web-push';
import { query, queryOne } from '../../database/connection';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// Configure Web Push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || 'mailto:support@rewabhoomi.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface SaveSubscriptionInput {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

// ─── Save Push Subscription ──────────────────────────────────────────────────
export const savePushSubscription = async (userId: string, input: SaveSubscriptionInput) => {
  if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    throw new Error('Invalid subscription keys');
  }

  await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (endpoint) 
     DO UPDATE SET user_id = $1, p256dh = $3, auth = $4, created_at = NOW()`,
    [userId, input.endpoint, input.keys.p256dh, input.keys.auth]
  );

  return { success: true };
};

// ─── Remove Push Subscription ───────────────────────────────────────────────
export const removePushSubscription = async (endpoint: string) => {
  await query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
};

// ─── Send Push to Single User ───────────────────────────────────────────────
export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  const subscriptions = await query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  if (subscriptions.length === 0) return;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    data: {
      ...(payload.data || {}),
      timestamp: Date.now()
    }
  });

  const sendPromises = subscriptions.map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        notificationPayload
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription is expired or unregistered
        await removePushSubscription(sub.endpoint);
      } else {
        logger.warn({ err, endpoint: sub.endpoint }, 'Push notification delivery failed');
      }
    }
  });

  await Promise.allSettled(sendPromises);
};

// ─── Send Push to All Admins ─────────────────────────────────────────────────
export const sendPushToAdmins = async (payload: PushPayload) => {
  const admins = await query<{ user_id: string }>(
    `SELECT DISTINCT ur.user_id 
     FROM user_roles ur 
     JOIN roles r ON r.id = ur.role_id 
     WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')`
  );

  for (const admin of admins) {
    await sendPushToUser(admin.user_id, payload);
  }
};

// ─── Dispatch Chat Message Push Notifications ────────────────────────────────
export const notifyChatMessagePush = async (params: {
  conversationId: string;
  type: 'SUPPORT' | 'DIRECT';
  initiatorId: string;
  recipientId: string | null;
  isApproved: boolean;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
}) => {
  const { conversationId, type, initiatorId, recipientId, isApproved, senderId, senderName, senderAvatar, content } = params;

  const messageIcon = senderAvatar || '/icons/icon-192x192.png';
  const badgeIcon = '/icons/badge-72x72.png';

  try {
    if (type === 'SUPPORT') {
      // Case 1: Support Conversation
      if (senderId === initiatorId) {
        // Regular user sent message to Support -> Notify Admins
        await sendPushToAdmins({
          title: `Support • ${senderName}`,
          body: content.length > 120 ? `${content.substring(0, 117)}...` : content,
          icon: messageIcon,
          badge: badgeIcon,
          data: {
            url: `/admin/chat?conversationId=${conversationId}`,
            conversationId
          }
        });
      } else {
        // Admin sent message -> Notify User
        await sendPushToUser(initiatorId, {
          title: 'Rewa Bhoomi Support',
          body: content.length > 120 ? `${content.substring(0, 117)}...` : content,
          icon: '/icons/icon-192x192.png',
          badge: badgeIcon,
          data: {
            url: `/?openChat=${conversationId}`,
            conversationId
          }
        });
      }
    } else if (type === 'DIRECT' && recipientId) {
      // Case 2: P2P Direct Conversation
      if (isApproved) {
        // APPROVED: Both users communicate directly
        const targetUserId = senderId === initiatorId ? recipientId : initiatorId;
        await sendPushToUser(targetUserId, {
          title: `${senderName}`,
          body: content.length > 120 ? `${content.substring(0, 117)}...` : content,
          icon: messageIcon,
          badge: badgeIcon,
          data: {
            url: `/?openChat=${conversationId}`,
            conversationId
          }
        });
      } else {
        // NOT APPROVED (Pending Moderation):
        if (senderId === initiatorId) {
          // User 1 sent message -> Notify Admins for moderation
          await sendPushToAdmins({
            title: `[Moderation] ${senderName}`,
            body: content.length > 120 ? `${content.substring(0, 117)}...` : content,
            icon: messageIcon,
            badge: badgeIcon,
            data: {
              url: `/admin/chat?conversationId=${conversationId}`,
              conversationId
            }
          });
        } else {
          // Admin ghost-replied or system responded -> Notify User 1
          await sendPushToUser(initiatorId, {
            title: `${senderName}`,
            body: content.length > 120 ? `${content.substring(0, 117)}...` : content,
            icon: messageIcon,
            badge: badgeIcon,
            data: {
              url: `/?openChat=${conversationId}`,
              conversationId
            }
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error, conversationId }, 'Error dispatching chat push notifications');
  }
};

// ─── Dispatch Property Creation / Update Notifications to Admins ────────────
export const notifyAdminsNewProperty = async (params: {
  propertyId: string;
  slug: string;
  title: string;
  city: string;
  ownerId: string;
  isUpdate?: boolean;
}) => {
  const { propertyId, slug, title, city, ownerId, isUpdate } = params;

  try {
    const owner = await queryOne<{ name: string; email: string }>(
      'SELECT name, email FROM users WHERE id = $1',
      [ownerId]
    );
    const ownerName = owner?.name || owner?.email?.split('@')[0] || 'User';

    const notifTitle = isUpdate ? `📝 Property Updated: ${title}` : `🏡 New Property Submitted`;
    const notifMessage = isUpdate
      ? `${ownerName} updated "${title}" in ${city}. Re-approval is required.`
      : `${ownerName} submitted a new property "${title}" in ${city} for approval.`;

    // 1. Insert In-App Notifications for all Admins
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       SELECT DISTINCT ur.user_id, 'PROPERTY_STATUS_CHANGED', $1, $2, $3::jsonb
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')`,
      [
        notifTitle,
        notifMessage,
        JSON.stringify({ propertyId, slug, isUpdate, ownerId, ownerName })
      ]
    );

    // 2. Send Web Push Notification to all Admins (Service Worker will show on device!)
    await sendPushToAdmins({
      title: notifTitle,
      body: notifMessage,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: `/admin/properties?search=${encodeURIComponent(title)}`,
        propertyId,
        timestamp: Date.now()
      }
    });

    // 3. Emit real-time Socket.IO alert
    try {
      const { getIO } = await import('../../socket');
      const io = getIO();
      if (io) {
        io.to('admins').emit('admin_property_alert', {
          propertyId,
          slug,
          title,
          ownerName,
          city,
          isUpdate: !!isUpdate
        });
      }
    } catch (e) {}
  } catch (error) {
    logger.error({ error, propertyId }, 'Error dispatching admin property notification');
  }
};

// ─── Dispatch Property Moderation Result to Owner ───────────────────────────
export const notifyUserPropertyModeration = async (params: {
  ownerId: string;
  propertyId: string;
  slug: string;
  title: string;
  status: 'PUBLISHED' | 'REJECTED';
  rejectionReason?: string | null;
}) => {
  const { ownerId, propertyId, slug, title, status, rejectionReason } = params;

  try {
    const isApproved = status === 'PUBLISHED';
    const notifTitle = isApproved ? '🎉 Property Approved & Published!' : '⚠️ Property Needs Revisions';
    const notifMessage = isApproved
      ? `Your property "${title}" has been approved and is now live on Rewa Bhoomi.`
      : `Your property "${title}" was not approved: ${rejectionReason || 'Please review listing details and re-submit.'}`;

    // 1. Insert In-App Notification for Owner
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        ownerId,
        isApproved ? 'PROPERTY_PUBLISHED' : 'PROPERTY_STATUS_CHANGED',
        notifTitle,
        notifMessage,
        JSON.stringify({ propertyId, slug, status, rejectionReason })
      ]
    );

    // 2. Send Web Push Notification to Owner
    await sendPushToUser(ownerId, {
      title: notifTitle,
      body: notifMessage,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: isApproved ? `/property/${slug}` : `/properties/edit/${propertyId}`,
        propertyId,
        timestamp: Date.now()
      }
    });

    // 3. Emit real-time Socket.IO alert to user room
    try {
      const { getIO } = await import('../../socket');
      const io = getIO();
      if (io) {
        io.to(`user:${ownerId}`).emit('property_moderation_alert', {
          propertyId,
          slug,
          title,
          status,
          rejectionReason
        });
      }
    } catch (e) {}
  } catch (error) {
    logger.error({ error, propertyId }, 'Error dispatching user property moderation notification');
  }
};
