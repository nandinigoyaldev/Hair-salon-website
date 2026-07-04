// Navigation Menu Toggle Logic
const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector("nav ul");
const navbar = document.querySelector("nav");

if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navList.addEventListener("click", (event) => {
        if (event.target.tagName === "A" && navList.classList.contains("is-open")) {
            navList.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}

// Sticky Header Transition on Scroll
window.addEventListener("scroll", () => {
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
});

// ==========================================
// DYNAMIC APPOINTMENT BOOKING SYSTEM
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const serviceSelect = document.getElementById("booking-service");
    const stylistSelect = document.getElementById("booking-stylist");
    const dateInput = document.getElementById("booking-date");
    const timeSlotsContainer = document.getElementById("time-slots-container");
    const timeSlotsGrid = document.getElementById("time-slots-grid");
    const timeHiddenInput = document.getElementById("booking-time");
    const bookingForm = document.getElementById("appointment-form");

    // Modal elements
    const modal = document.getElementById("booking-modal");
    const modalIcon = document.getElementById("modal-icon");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalCloseSpan = document.querySelector(".close-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");

    // Set minimum date to today
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("min", today);
    }

    // Standard business hours (9:00 AM - 5:00 PM)
    const availableSlots = [
        "09:00", "10:00", "11:00", "12:00", 
        "13:00", "14:00", "15:00", "16:00", "17:00"
    ];

    // Helper to format time strings for user display (e.g. "13:00" -> "1:00 PM")
    function formatTimeLabel(timeStr) {
        const [hour, minute] = timeStr.split(":").map(Number);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute < 10 ? "0" + minute : minute} ${ampm}`;
    }

    // Load Services and Stylists on page load
    async function loadFormCatalogs() {
        try {
            // Load Services
            const servicesResponse = await fetch("/api/services");
            const services = await servicesResponse.json();
            
            if (serviceSelect) {
                services.forEach(service => {
                    const opt = document.createElement("option");
                    opt.value = service.id;
                    opt.textContent = `${service.name} ($${service.price.toFixed(2)})`;
                    serviceSelect.appendChild(opt);
                });
            }

            // Load Stylists
            const stylistsResponse = await fetch("/api/stylists");
            const stylists = await stylistsResponse.json();
            
            if (stylistSelect) {
                stylists.forEach(stylist => {
                    const opt = document.createElement("option");
                    opt.value = stylist.id;
                    opt.textContent = `${stylist.name} - ${stylist.specialty}`;
                    stylistSelect.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Error loading booking dropdown data:", err);
        }
    }

    // Check availability based on selected stylist and date
    async function checkAvailability() {
        if (!stylistSelect || !dateInput || !timeSlotsGrid || !timeSlotsContainer) return;

        const stylistId = stylistSelect.value;
        const dateVal = dateInput.value;

        // Reset selected time slot
        timeHiddenInput.value = "";

        if (!stylistId || !dateVal) {
            timeSlotsGrid.innerHTML = '<span class="slots-placeholder">Please select a stylist and date first.</span>';
            timeSlotsContainer.classList.remove("show");
            return;
        }

        timeSlotsGrid.innerHTML = '<span class="slots-placeholder">Checking availability...</span>';
        timeSlotsContainer.classList.add("show");

        try {
            const res = await fetch(`/api/availability?stylist_id=${stylistId}&date=${dateVal}`);
            const data = await res.json();
            
            if (res.ok) {
                const bookedSlots = data.bookedSlots || [];
                renderTimeSlots(bookedSlots);
                timeSlotsContainer.classList.add("show");
            } else {
                timeSlotsGrid.innerHTML = `<span class="slots-placeholder" style="color: #ff5555;">${data.error || "Failed to load slots."}</span>`;
                timeSlotsContainer.classList.remove("show");
            }
        } catch (err) {
            console.error("Error checking availability:", err);
            timeSlotsGrid.innerHTML = '<span class="slots-placeholder" style="color: #ff5555;">Server error. Please try again.</span>';
            timeSlotsContainer.classList.remove("show");
        }
    }

    // Render slots inside grid
    function renderTimeSlots(bookedSlots) {
        if (!timeSlotsGrid) return;
        timeSlotsGrid.innerHTML = "";

        availableSlots.forEach(time => {
            const isBooked = bookedSlots.includes(time);
            
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "time-slot-btn";
            btn.textContent = formatTimeLabel(time);
            btn.dataset.time = time;

            if (isBooked) {
                btn.classList.add("disabled");
                btn.disabled = true;
            } else {
                btn.addEventListener("click", () => {
                    // Remove selection from others
                    document.querySelectorAll(".time-slot-btn").forEach(el => el.classList.remove("selected"));
                    // Select this one
                    btn.classList.add("selected");
                    timeHiddenInput.value = time;
                });
            }
            timeSlotsGrid.appendChild(btn);
        });
    }

    // Form Event Listeners to query availability
    if (stylistSelect) stylistSelect.addEventListener("change", checkAvailability);
    if (dateInput) dateInput.addEventListener("change", checkAvailability);

    // Modal Actions
    function showModal(isSuccess, title, message) {
        if (!modal) return;
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        if (isSuccess) {
            modalIcon.textContent = "✓";
            modalIcon.className = ""; // Successful theme
        } else {
            modalIcon.textContent = "✗";
            modalIcon.className = "error";
        }

        modal.style.display = "block";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
    }

    if (modalCloseSpan) modalCloseSpan.addEventListener("click", closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // Form Submission
    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("booking-name").value.trim();
            const email = document.getElementById("booking-email").value.trim();
            const phone = document.getElementById("booking-phone").value.trim();
            const serviceId = serviceSelect.value;
            const stylistId = stylistSelect.value;
            const date = dateInput.value;
            const time = timeHiddenInput.value;

            if (!time) {
                showModal(false, "Time Slot Missing", "Please pick an available time slot before booking.");
                return;
            }

            try {
                const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        service_id: serviceId,
                        stylist_id: stylistId,
                        date,
                        time
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showModal(
                        true, 
                        "Booking Request Received!", 
                        `Thank you ${name}! Your styling session is requested for ${date} at ${formatTimeLabel(time)}. An admin will review and confirm shortly.`
                    );
                    
                    // Reset form and slots grid
                    bookingForm.reset();
                    timeSlotsGrid.innerHTML = '<span class="slots-placeholder">Please select a stylist and date first.</span>';
                    timeSlotsContainer.classList.remove("show");
                    
                    // Set min date again
                    const today = new Date().toISOString().split("T")[0];
                    dateInput.setAttribute("min", today);
                } else {
                    showModal(false, "Booking Failed", result.error || "An error occurred. Please try again.");
                }
            } catch (err) {
                console.error("Booking submission error:", err);
                showModal(false, "Server Connection Error", "Unable to reach the server. Please verify your internet connection.");
            }
        });
    }

    // Scroll Reveal IntersectionObserver
    const revealSections = document.querySelectorAll(".scroll-reveal");
    if (revealSections.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target); // Trigger animation once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });
        revealSections.forEach(section => revealObserver.observe(section));
    }

    // FAQ Accordion Click Listeners
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    accordionHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const item = header.parentElement;
            const collapse = header.nextElementSibling;
            const isActive = item.classList.contains("active");

            // Close other open accordion items
            document.querySelectorAll(".faq-accordion-item").forEach(el => {
                if (el !== item) {
                    el.classList.remove("active");
                    const otherCollapse = el.querySelector(".accordion-collapse");
                    if (otherCollapse) {
                        otherCollapse.style.maxHeight = null;
                        otherCollapse.style.opacity = "0";
                    }
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove("active");
                collapse.style.maxHeight = null;
                collapse.style.opacity = "0";
            } else {
                item.classList.add("active");
                collapse.style.maxHeight = collapse.scrollHeight + "px";
                collapse.style.opacity = "1";
            }
        });
    });

    // Run Initial Load
    loadFormCatalogs();
});
