document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("reminderForm");
  const messageDiv = document.getElementById("message");
  const remindersList = document.getElementById("remindersList");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const urlInput = document.getElementById("urlInput");
  let editMode = false;
  let currentEditId = null;

  // Make the date and time wrappers clickable
  document
    .querySelector(".date-wrapper")
    .addEventListener("click", function () {
      dateInput.showPicker();
    });

  document
    .querySelector(".time-wrapper")
    .addEventListener("click", function () {
      timeInput.showPicker();
    });

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  // Load existing reminders
  loadReminders();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const url = urlInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    // Create a Date object from the inputs
    const reminderDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (reminderDateTime <= now) {
      showMessage("Please select a future date and time.", "error");
      return;
    }

    if (editMode && currentEditId) {
      // Update existing reminder
      updateReminder(currentEditId, url, reminderDateTime);
      editMode = false;
      currentEditId = null;
      form.querySelector('button[type="submit"]').textContent = "Set Reminder";
    } else {
      // Create new reminder
      const reminderId = Date.now().toString();
      const alarmName = `reminder_${reminderId}`;

      // Save reminder details
      chrome.storage.local.get("reminders", function (data) {
        const reminders = data.reminders || {};
        reminders[alarmName] = {
          id: reminderId,
          url: url,
          dateTime: reminderDateTime.toString(),
          timestamp: reminderDateTime.getTime(),
        };

        chrome.storage.local.set({ reminders: reminders }, function () {
          // Create the alarm
          chrome.alarms.create(alarmName, {
            when: reminderDateTime.getTime(),
          });

          showMessage("Reminder set successfully!", "success");
          form.reset();
          loadReminders();
        });
      });
    }
  });

  function updateReminder(reminderId, url, newDateTime) {
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};
      let oldAlarmName = "";

      // Find the alarm by reminder ID
      for (const key in reminders) {
        if (reminders[key].id === reminderId) {
          oldAlarmName = key;
          break;
        }
      }

      if (oldAlarmName) {
        // Clear old alarm
        chrome.alarms.clear(oldAlarmName);

        // Create new alarm
        const newAlarmName = `reminder_${reminderId}_${Date.now()}`;
        reminders[newAlarmName] = {
          id: reminderId,
          url: url,
          dateTime: newDateTime.toString(),
          timestamp: newDateTime.getTime(),
        };

        // Remove old alarm data
        delete reminders[oldAlarmName];

        // Save updated reminders
        chrome.storage.local.set({ reminders: reminders }, function () {
          chrome.alarms.create(newAlarmName, {
            when: newDateTime.getTime(),
          });

          showMessage("Reminder updated successfully!", "success");
          form.reset();
          loadReminders();
        });
      }
    });
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    setTimeout(() => {
      messageDiv.className = "hidden";
    }, 3000);
  }

  function loadReminders() {
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};
      remindersList.innerHTML = "";

      const now = Date.now();
      const sortedReminders = Object.values(reminders)
        .filter((reminder) => reminder.timestamp > now)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (sortedReminders.length === 0) {
        remindersList.innerHTML =
          '<li class="no-reminders">No active reminders</li>';
        return;
      }

      sortedReminders.forEach((reminder) => {
        const li = document.createElement("li");
        const dateTime = new Date(reminder.dateTime);
        const formattedDate = dateTime.toLocaleDateString();
        const formattedTime = dateTime.toLocaleTimeString();

        li.innerHTML = `
          <div class="reminder-item">
            <div class="reminder-info">
              <strong>${formattedDate}, ${formattedTime}</strong>
              <div class="reminder-url">${reminder.url}</div>
            </div>
            <div class="reminder-actions">
              <button class="action-btn edit-btn" data-id="${reminder.id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" data-id="${reminder.id}" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
        `;
        remindersList.appendChild(li);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const reminderId = this.getAttribute("data-id");
          deleteReminder(reminderId);
        });
      });

      // Add event listeners to edit buttons
      document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const reminderId = this.getAttribute("data-id");
          editReminder(reminderId);
        });
      });
    });
  }

  function editReminder(reminderId) {
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};
      let reminderToEdit = null;

      // Find the reminder by ID
      for (const key in reminders) {
        if (reminders[key].id === reminderId) {
          reminderToEdit = reminders[key];
          break;
        }
      }

      if (reminderToEdit) {
        // Set the form in edit mode
        editMode = true;
        currentEditId = reminderId;

        // Fill the form with reminder details
        urlInput.value = reminderToEdit.url;

        const reminderDate = new Date(reminderToEdit.dateTime);

        // Format date as YYYY-MM-DD
        const year = reminderDate.getFullYear();
        const month = String(reminderDate.getMonth() + 1).padStart(2, "0");
        const day = String(reminderDate.getDate()).padStart(2, "0");
        dateInput.value = `${year}-${month}-${day}`;

        // Format time as HH:MM
        const hours = String(reminderDate.getHours()).padStart(2, "0");
        const minutes = String(reminderDate.getMinutes()).padStart(2, "0");
        timeInput.value = `${hours}:${minutes}`;

        // Change button text
        form.querySelector('button[type="submit"]').textContent =
          "Update Reminder";

        // Scroll to the form
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function deleteReminder(reminderId) {
    chrome.storage.local.get("reminders", function (data) {
      const reminders = data.reminders || {};

      for (const key in reminders) {
        if (reminders[key].id === reminderId) {
          chrome.alarms.clear(key);
          delete reminders[key];
        }
      }

      chrome.storage.local.set({ reminders: reminders }, function () {
        loadReminders();
        showMessage("Reminder deleted", "success");

        // If we're in edit mode for this reminder, reset the form
        if (editMode && currentEditId === reminderId) {
          editMode = false;
          currentEditId = null;
          form.reset();
          form.querySelector('button[type="submit"]').textContent =
            "Set Reminder";
        }
      });
    });
  }
});
