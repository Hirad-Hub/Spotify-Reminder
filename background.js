// Listen for alarms
chrome.alarms.onAlarm.addListener(function (alarm) {
  // Check if it's a reminder alarm
  if (alarm.name.startsWith("reminder_")) {
    // Get reminder details from storage
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};
      const reminder = reminders[alarm.name];

      if (reminder) {
        // Create notification with proper options
        chrome.notifications.create(alarm.name, {
          type: "basic",
          iconUrl: "icon128.png",
          title: "It's time to listen to your music!",
          message: reminder.url,
          buttons: [{ title: "Open URL" }],
          priority: 2,
          requireInteraction: true, // This keeps the notification visible until user interacts with it
        });

        // Clean up - remove from storage
        delete reminders[alarm.name];
        chrome.storage.local.set({ reminders: reminders });
      }
    });
  }
});

// Handle notification button click
chrome.notifications.onButtonClicked.addListener(function (
  notificationId,
  buttonIndex
) {
  if (buttonIndex === 0) {
    // Extract the URL from the notification ID (which is the alarm name)
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};
      const url = reminders[notificationId]?.url;
      if (url) {
        chrome.tabs.create({ url: url });
      }
      chrome.notifications.clear(notificationId);
    });
  }
});

// Handle notification click
chrome.notifications.onClicked.addListener(function (notificationId) {
  // Extract the URL from the notification ID (which is the alarm name)
  chrome.storage.local.get("reminders", function (data) {
    const reminders = data.reminders || {};
    const url = reminders[notificationId]?.url;
    if (url) {
      chrome.tabs.create({ url: url });
    }
    chrome.notifications.clear(notificationId);
  });
});

// Make sure the service worker stays active
chrome.runtime.onInstalled.addListener(() => {
  console.log("URL Reminder extension installed");
});

// Keep the service worker alive
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("Keeping service worker alive");
  }
});
