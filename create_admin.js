document.addEventListener("DOMContentLoaded", async function () {
  // Check if user is authenticated (assumes JWT token is stored in localStorage)
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    // Verify superadmin status
    const response = await fetch("/get-admin?admin_id=SUP001", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const adminData = await response.json();
    if (adminData.role !== "superadmin") {
      console.log("Regular admin logged in");
      // Hide admin creation features
      document.getElementById("adminForm")?.remove();
    } else {
      console.log("Superadmin logged in");
      // Show admin creation form
      loadPanchayats();
      setupForm();
    }
  } catch (error) {
    console.error("Error checking admin:", error);
    window.location.href = "index.html";
  }

  // Load panchayats for dropdown
  async function loadPanchayats() {
    try {
      const response = await fetch("/get-panchayats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const panchayats = await response.json();
      const panchayatSelect = document.getElementById("panchayatId");
      panchayats.forEach((panchayat) => {
        const option = document.createElement("option");
        option.value = panchayat.panchayat_id;
        option.textContent = `${panchayat.panchayat_id} - ${panchayat.panchayat_name}`;
        panchayatSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading panchayats:", error);
    }
  }

  // Setup form submission
  function setupForm() {
    const adminForm = document.getElementById("adminForm");
    if (!adminForm) return;

    // Fetch next admin ID
    fetch("/get-latest-id?collection=admins&prefix=ADM")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("adminId").value = data.nextId;
      })
      .catch((error) => console.error("Error fetching admin ID:", error));

    adminForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const adminData = {
        admin_id: document.getElementById("adminId").value,
        name: document.getElementById("name").value,
        aadhaar_no: document.getElementById("aadhaarNo").value,
        email: document.getElementById("email").value,
        contact: document.getElementById("contact").value,
        password: document.getElementById("password").value,
        panchayat_id: document.getElementById("panchayatId").value,
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
            email: adminData.email,
            data: adminData,
            type: "admin",
          }),
        });

        const otpResult = await otpResponse.json();
        if (otpResponse.ok) {
          alert("OTP sent to email. Please verify.");
          document.getElementById("otpSection").style.display = "block";
        } else {
          alert(otpResult.message);
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
            body: JSON.stringify({ email: adminData.email, otp }),
          });

          const verifyResult = await verifyResponse.json();
          if (verifyResponse.ok) {
            // Save admin after OTP verification
            const addResponse = await fetch("/add-admin", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(adminData),
            });

            const addResult = await addResponse.json();
            if (addResponse.ok) {
              alert("Admin added successfully!");
              adminForm.reset();
              document.getElementById("otpSection").style.display = "none";
            } else {
              alert(addResult.message);
            }
          } else {
            alert(verifyResult.message);
          }
        });
      } catch (error) {
        console.error("Error creating admin:", error);
        alert("Error creating admin. Please try again.");
      }
    });
  }
});