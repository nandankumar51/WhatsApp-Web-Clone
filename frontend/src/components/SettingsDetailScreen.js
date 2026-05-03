import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as apiService from '../services/apiService';
import Avatar from './ui/Avatar';
import { getUserId } from '../utils/formatters';

function ToggleRow({ title, description, enabled, onToggle }) {
  return (
    <button type="button" className="settings-toggle-row" onClick={onToggle}>
      <span>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <i className={`settings-switch ${enabled ? 'enabled' : ''}`} aria-hidden="true" />
    </button>
  );
}

function InfoCard({ eyebrow, title, description, action }) {
  return (
    <div className="settings-info-card">
      {eyebrow ? <p className="settings-eyebrow">{eyebrow}</p> : null}
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
      {action ? <button type="button" className="settings-card-action">{action}</button> : null}
    </div>
  );
}

function SettingsDetailScreen({
  section,
  currentUser,
  theme,
  onBack,
  onToggleTheme,
  onUserUpdate,
  chatPreferences,
  onChatPreferencesChange,
}) {
  const detailScreenRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    username: currentUser.username || '',
    status: currentUser.status || '',
    profilePicture: currentUser.profilePicture || '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [toggles, setToggles] = useState({
    securityNotifications: true,
    readReceipts: true,
    lastSeen: true,
    profilePhoto: true,
    disappearingMessages: false,
    desktopAlerts: true,
    messageSounds: true,
    groupMentions: true,
    linkPreview: true,
  });
  const chatPrefs = chatPreferences || {};

  useEffect(() => {
    detailScreenRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  const meta = useMemo(() => ({
    Profile: {
      eyebrow: 'Identity',
      description: 'Manage how your profile appears to contacts.',
    },
    Account: {
      eyebrow: 'Security',
      description: 'Protect your account and review sign-in details.',
    },
    Privacy: {
      eyebrow: 'Control',
      description: 'Choose what others can see and how messages behave.',
    },
    Chats: {
      eyebrow: 'Experience',
      description: 'Adjust theme, wallpaper, and chat density.',
    },
    Notifications: {
      eyebrow: 'Alerts',
      description: 'Tune sounds, desktop alerts, and group mentions.',
    },
    Shortcuts: {
      eyebrow: 'Productivity',
      description: 'Keyboard patterns for faster navigation.',
    },
  }), []);

  const updateToggle = (key) => {
    setToggles((value) => ({ ...value, [key]: !value[key] }));
  };

  const updateChatPref = (key, value) => {
    onChatPreferencesChange?.({ [key]: value });
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((form) => ({ ...form, [name]: value }));
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setNotice('');
      const response = await apiService.updateUserProfile(getUserId(currentUser), profileForm);
      const updatedUser = response.data.user || {
        ...currentUser,
        ...profileForm,
      };

      onUserUpdate?.({
        ...currentUser,
        ...updatedUser,
        id: getUserId(updatedUser) || getUserId(currentUser),
      });
      setNotice('Profile updated successfully.');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not update profile right now.');
    } finally {
      setSaving(false);
    }
  };

  const renderProfile = () => (
    <>
      <div className="settings-profile-hero">
        <Avatar user={{ ...currentUser, ...profileForm }} size="xl" isOnline />
        <div>
          <h3>{profileForm.username || 'Your name'}</h3>
          <p>{profileForm.status || 'Set a status message'}</p>
        </div>
      </div>

      <label className="settings-field" htmlFor="settings-username">
        <span>Display name</span>
        <input
          id="settings-username"
          name="username"
          value={profileForm.username}
          onChange={handleProfileChange}
          placeholder="Your display name"
        />
      </label>

      <label className="settings-field" htmlFor="settings-status">
        <span>Status</span>
        <textarea
          id="settings-status"
          name="status"
          value={profileForm.status}
          onChange={handleProfileChange}
          placeholder="Hey there! I am using WhatsApp."
          rows="3"
        />
      </label>

      <label className="settings-field" htmlFor="settings-photo">
        <span>Profile photo URL</span>
        <input
          id="settings-photo"
          name="profilePicture"
          value={profileForm.profilePicture}
          onChange={handleProfileChange}
          placeholder="https://..."
        />
      </label>

      {notice ? <p className="settings-notice">{notice}</p> : null}
      <button type="button" className="settings-save-button" onClick={handleProfileSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </>
  );

  const renderAccount = () => (
    <>
      <InfoCard
        eyebrow="Signed in as"
        title={currentUser.email}
        description="This email is used for login and account recovery in the MVP."
      />
      <ToggleRow
        title="Security notifications"
        description="Get alerts when account or session settings change."
        enabled={toggles.securityNotifications}
        onToggle={() => updateToggle('securityNotifications')}
      />
      <InfoCard
        eyebrow="MVP ready"
        title="Two-step verification"
        description="Add an OTP/email verification flow before production deployment."
        action="Planned"
      />
      <InfoCard
        eyebrow="Session"
        title="Current device"
        description="Mac browser session connected through JWT authentication."
        action="Active"
      />
    </>
  );

  const renderPrivacy = () => (
    <>
      <ToggleRow
        title="Show last seen"
        description="Let contacts know when you were last active."
        enabled={toggles.lastSeen}
        onToggle={() => updateToggle('lastSeen')}
      />
      <ToggleRow
        title="Profile photo visibility"
        description="Allow contacts to view your avatar."
        enabled={toggles.profilePhoto}
        onToggle={() => updateToggle('profilePhoto')}
      />
      <ToggleRow
        title="Read receipts"
        description="Show blue ticks after messages are read."
        enabled={toggles.readReceipts}
        onToggle={() => updateToggle('readReceipts')}
      />
      <ToggleRow
        title="Disappearing messages"
        description="Auto-clean future messages in privacy-focused chats."
        enabled={toggles.disappearingMessages}
        onToggle={() => updateToggle('disappearingMessages')}
      />
      <InfoCard
        eyebrow="Blocked contacts"
        title="No blocked contacts"
        description="Blocked-user management can be connected to a contacts collection next."
      />
    </>
  );

  const renderChats = () => (
    <>
      <div className="chat-settings-hero">
        <div>
          <p className="settings-eyebrow">Live preview</p>
          <h3>Personalize your chat space</h3>
          <small>{chatPrefs.wallpaper} wallpaper · {chatPrefs.bubbleStyle} bubbles · {chatPrefs.fontSize} text</small>
        </div>
        <div className={`mini-chat-preview wallpaper-${chatPrefs.wallpaper.toLowerCase()} bubbles-${chatPrefs.bubbleStyle.toLowerCase()}`}>
          <span className="mini-date">Today</span>
          <p className="mini-bubble received">This layout feels clean.</p>
          <p className="mini-bubble sent">Make it portfolio-ready.</p>
        </div>
      </div>

      <div className="settings-section-block">
        <div className="settings-section-title">
          <p className="settings-eyebrow">Appearance</p>
          <h4>Theme</h4>
        </div>
        <div className="settings-theme-grid">
          <button
            type="button"
            className={`theme-choice ${theme === 'light' ? 'selected' : ''}`}
            onClick={() => theme !== 'light' && onToggleTheme()}
          >
            <span className="theme-preview light-preview" />
            <strong>Light</strong>
            <small>Clean daylight interface</small>
          </button>
          <button
            type="button"
            className={`theme-choice ${theme === 'dark' ? 'selected' : ''}`}
            onClick={() => theme !== 'dark' && onToggleTheme()}
          >
            <span className="theme-preview dark-preview" />
            <strong>Dark</strong>
            <small>Premium low-light mode</small>
          </button>
        </div>
      </div>

      <div className="settings-section-block">
        <div className="settings-section-title">
          <p className="settings-eyebrow">Wallpaper</p>
          <h4>Chat background</h4>
        </div>
        <div className="wallpaper-grid">
          {['Dotted', 'Aura', 'Minimal', 'Paper'].map((wallpaper) => (
            <button
              type="button"
              key={wallpaper}
              className={`wallpaper-choice ${chatPrefs.wallpaper === wallpaper ? 'selected' : ''} wallpaper-${wallpaper.toLowerCase()}`}
              onClick={() => updateChatPref('wallpaper', wallpaper)}
            >
              <span />
              <strong>{wallpaper}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section-block">
        <div className="settings-section-title">
          <p className="settings-eyebrow">Messages</p>
          <h4>Bubble style</h4>
        </div>
        <div className="segmented-choice">
          {['Soft', 'Glass', 'Compact'].map((style) => (
            <button
              type="button"
              key={style}
              className={chatPrefs.bubbleStyle === style ? 'selected' : ''}
              onClick={() => updateChatPref('bubbleStyle', style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section-block">
        <div className="settings-section-title">
          <p className="settings-eyebrow">Text</p>
          <h4>Font size</h4>
        </div>
        <div className="font-size-choice">
          {['Small', 'Comfort', 'Large'].map((size) => (
            <button
              type="button"
              key={size}
              className={chatPrefs.fontSize === size ? 'selected' : ''}
              onClick={() => updateChatPref('fontSize', size)}
            >
              <span className={`font-sample sample-${size.toLowerCase()}`}>Aa</span>
              <strong>{size}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-theme-grid">
        <InfoCard
          eyebrow="Archive"
          title="Archived chats"
          description={chatPrefs.keepArchived ? 'Archived chats stay muted until you open them.' : 'Archived chats return when new messages arrive.'}
          action={chatPrefs.keepArchived ? 'Stay archived' : 'Auto return'}
        />
        <InfoCard
          eyebrow="Storage"
          title="Media and files"
          description={`${chatPrefs.mediaQuality} uploads with ${chatPrefs.mediaPreview ? 'image previews enabled' : 'previews disabled'}.`}
          action="Manage"
        />
      </div>

      <ToggleRow
        title="Enter to send"
        description="Send faster with Enter. Use Shift + Enter for a new line."
        enabled={chatPrefs.enterToSend}
        onToggle={() => updateChatPref('enterToSend', !chatPrefs.enterToSend)}
      />
      <ToggleRow
        title="Compact chat list"
        description="Show tighter rows for high-volume conversations."
        enabled={chatPrefs.compactMode}
        onToggle={() => updateChatPref('compactMode', !chatPrefs.compactMode)}
      />
      <ToggleRow
        title="Media preview before sending"
        description="Show images and file cards in the composer before delivery."
        enabled={chatPrefs.mediaPreview}
        onToggle={() => updateChatPref('mediaPreview', !chatPrefs.mediaPreview)}
      />
      <ToggleRow
        title="Link previews"
        description="Prepare rich previews for URLs shared in messages."
        enabled={toggles.linkPreview}
        onToggle={() => updateToggle('linkPreview')}
      />
      <ToggleRow
        title="Auto-scroll to newest message"
        description="Keep the chat focused on fresh incoming messages."
        enabled={chatPrefs.autoScroll}
        onToggle={() => updateChatPref('autoScroll', !chatPrefs.autoScroll)}
      />
      <ToggleRow
        title="High quality media"
        description="Prioritize image clarity over lighter uploads."
        enabled={chatPrefs.highQualityMedia}
        onToggle={() => updateChatPref('highQualityMedia', !chatPrefs.highQualityMedia)}
      />
      <ToggleRow
        title="Keep archived chats archived"
        description="Archived conversations stay quiet until you open them."
        enabled={chatPrefs.keepArchived}
        onToggle={() => updateChatPref('keepArchived', !chatPrefs.keepArchived)}
      />
    </>
  );

  const renderNotifications = () => (
    <>
      <ToggleRow
        title="Desktop alerts"
        description="Show browser-level alerts for new messages."
        enabled={toggles.desktopAlerts}
        onToggle={() => updateToggle('desktopAlerts')}
      />
      <ToggleRow
        title="Message sounds"
        description="Play a light notification sound for incoming messages."
        enabled={toggles.messageSounds}
        onToggle={() => updateToggle('messageSounds')}
      />
      <ToggleRow
        title="Group mentions"
        description="Prioritize alerts when someone mentions you in a group."
        enabled={toggles.groupMentions}
        onToggle={() => updateToggle('groupMentions')}
      />
      <InfoCard
        eyebrow="Browser permission"
        title="Notifications are MVP placeholders"
        description="Connect the browser Notification API when you add production permissions."
      />
    </>
  );

  const renderShortcuts = () => (
    <div className="shortcut-list">
      {[
        ['Start new chat', 'N'],
        ['Search chats', '/'],
        ['Send message', 'Enter'],
        ['New line', 'Shift + Enter'],
        ['Close panel', 'Esc'],
      ].map(([label, value]) => (
        <div className="shortcut-row" key={label}>
          <span>{label}</span>
          <kbd>{value}</kbd>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (section === 'Profile') return renderProfile();
    if (section === 'Account') return renderAccount();
    if (section === 'Privacy') return renderPrivacy();
    if (section === 'Chats') return renderChats();
    if (section === 'Notifications') return renderNotifications();
    return renderShortcuts();
  };

  return (
    <div ref={detailScreenRef} className="settings-detail-screen">
      <div className="settings-detail-header">
        <button type="button" className="back-btn" onClick={onBack}>Back</button>
        <div>
          <p>{meta[section]?.eyebrow}</p>
          <h2>{section}</h2>
        </div>
      </div>

      <div className="settings-detail-intro">
        <p>{meta[section]?.description}</p>
      </div>

      <div className="settings-detail-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default SettingsDetailScreen;
