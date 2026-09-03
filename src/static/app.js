document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants <span>${details.participants.length}</span></h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "empty-participants";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";
            participantItem.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.className = "participant-remove";
            removeButton.type = "button";
            removeButton.dataset.participant = participant;
            removeButton.setAttribute("aria-label", `Remove ${participant}`);
            removeButton.innerHTML = "&times;";

            participantItem.appendChild(removeButton);
            participantsList.appendChild(participantItem);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");
    if (!removeButton) {
      return;
    }

    const activityCard = removeButton.closest(".activity-card");
    const participantItem = removeButton.closest(".participant-item");
    const participantList = participantItem.parentElement;
    const participantEmail = removeButton.dataset.participant;

    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityCard.dataset.activityName)}/participants/${encodeURIComponent(participantEmail)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to unregister participant");
      }

      participantItem.remove();
      const participantCount = activityCard.querySelector(".participants-section h5 span");
      participantCount.textContent = participantList.children.length;

      if (participantList.children.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-participants";
        emptyItem.textContent = "No participants yet";
        participantList.appendChild(emptyItem);
      }
    } catch (error) {
      removeButton.disabled = false;
      console.error("Error unregistering participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
