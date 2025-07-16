document.addEventListener("DOMContentLoaded", function () {
  // Check if user is authenticated (assumes JWT token is stored in localStorage)
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const panchayatForm = document.getElementById("panchayatForm");

  // Fetch next panchayat ID
  fetch("/get-latest-id?collection=panchayats&prefix=PAN")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("panchayatId").value = data.nextId;
    })
    .catch((error) => console.error("Error fetching panchayat ID:", error));

  // Load available admins
  loadAdmins();

  // Form submission handler
  panchayatForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const panchayatData = {
      panchayat_id: document.getElementById("panchayatId").value,
      panchayat_name: document.getElementById("panchayatName").value,
      location: document.getElementById("location").value,
      admin_id: document.getElementById("adminId").value,
    };

    try {
      // Send OTP
      const otpResponse = await fetch("/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: "admin@example.com", // Replace with actual admin email or form input
          data: panchayatData,
          type: "panchayat",
        }),
      });

      const otpResult = await otpResponse.json();
      if (otpResponse.ok) {
        alert("OTP sent to email. Please verify.");
        document.getElementById("otpSection").style.display = "block";
      } else {
        alert(otpResult.message);
        return;
      }

      // Verify OTP and save
      document.getElementById("verifyOtp").addEventListener("click", async function () {
        const otp = document.getElementById("otp").value;
        const verifyResponse = await fetch("/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: "admin@example.com", otp }),
        });

        const verifyResult = await verifyResponse.json();
        if (verifyResponse.ok) {
          // Save panchayat after OTP verification
          const addResponse = await fetch("/add-panchayat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(panchayatData),
          });

          const addResult = await addResponse.json();
          if (addResponse.ok) {
            alert("Panchayat created successfully!");
            panchayatForm.reset();
            document.getElementById("otpSection").style.display = "none";
          } else {
            alert(addResult.message);
          }
        } else {
          alert(verifyResult.message);
        }
      });
    } catch (error) {
      console.error("Error creating panchayat:", error);
      alert("Error creating panchayat. Please try again.");
    }
  });

  // Function to load admins into dropdown
  async function loadAdmins() {
    const adminSelect = document.getElementById("adminId");
    try {
      const response = await fetch("/get-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const admins = await response.json();
      admins.forEach((admin) => {
        const option = document.createElement("option");
        option.value = admin.admin_id;
        option.textContent = `${admin.admin_id} - ${admin.name || "Admin"}`;
        adminSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  }
});