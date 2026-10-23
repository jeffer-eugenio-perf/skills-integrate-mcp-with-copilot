document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupAccessMessage = document.getElementById("signup-access-message");
  const messageDiv = document.getElementById("message");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginForm = document.getElementById("login-form");
  const authMessage = document.getElementById("auth-message");
  let isTeacher = false;

  function setTeacherStatus(authenticated) {
    isTeacher = authenticated;
    loginButton.classList.toggle("hidden", authenticated);
    logoutButton.classList.toggle("hidden", !authenticated);
    loginForm.classList.add("hidden");
    loginButton.setAttribute("aria-expanded", "false");
    signupForm.classList.toggle("hidden", !authenticated);
    signupAccessMessage.classList.toggle("hidden", authenticated);
  }

  function showAuthMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle("error", isError);
    authMessage.classList.toggle("success", !isError && message !== "");
  }

  async function checkTeacherStatus() {
    const response = await fetch("/auth/me");
    if (!response.ok) {
      throw new Error(`Failed to check teacher session (${response.status})`);
    }
    const result = await response.json();
    setTeacherStatus(result.authenticated);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities (${response.status})`);
      }
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft =
          details.max_participants - details.participants.length;
        const title = document.createElement("h4");
        title.textContent = name;
        const description = document.createElement("p");
        description.textContent = details.description;
        const schedule = document.createElement("p");
        schedule.textContent = `Schedule: ${details.schedule}`;
        const availability = document.createElement("p");
        availability.textContent = `Availability: ${spotsLeft} spots left`;
        activityCard.append(title, description, schedule, availability);

        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";
        if (details.participants.length > 0) {
          const participantsHeading = document.createElement("h5");
          participantsHeading.textContent = "Participants:";
          const participantsList = document.createElement("ul");
          details.participants.forEach((email) => {
            const listItem = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;
            listItem.appendChild(participantEmail);

            if (isTeacher) {
              const removeButton = document.createElement("button");
              removeButton.className = "delete-btn";
              removeButton.type = "button";
              removeButton.textContent = "Remove";
              removeButton.dataset.activity = name;
              removeButton.dataset.email = email;
              removeButton.addEventListener("click", handleUnregister);
              listItem.appendChild(removeButton);
            }
            participantsList.appendChild(listItem);
          });
          participantsContainer.append(participantsHeading, participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.textContent = "No participants yet";
          participantsContainer.appendChild(emptyMessage);
        }
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        if (response.status === 401) {
          setTeacherStatus(false);
          await fetchActivities();
        }
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  loginButton.addEventListener("click", () => {
    const isExpanded = loginButton.getAttribute("aria-expanded") === "true";
    loginButton.setAttribute("aria-expanded", String(!isExpanded));
    loginForm.classList.toggle("hidden", isExpanded);
    if (!isExpanded) {
      document.getElementById("username").focus();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        showAuthMessage(result.detail || "Unable to log in", true);
        return;
      }
      loginForm.reset();
      showAuthMessage(result.message);
      setTeacherStatus(true);
      await fetchActivities();
    } catch (error) {
      showAuthMessage("Unable to log in. Please try again.", true);
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        showAuthMessage(result.detail || "Unable to log out", true);
        return;
      }
      setTeacherStatus(false);
      showAuthMessage(result.message);
      await fetchActivities();
    } catch (error) {
      showAuthMessage("Unable to log out. Please try again.", true);
      console.error("Error logging out:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
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
        if (response.status === 401) {
          setTeacherStatus(false);
          await fetchActivities();
        }
      }

      messageDiv.classList.remove("hidden");

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

  setTeacherStatus(false);
  checkTeacherStatus()
    .catch((error) => {
      showAuthMessage("Could not check teacher login status.", true);
      console.error("Error checking teacher session:", error);
    })
    .finally(fetchActivities);
});
