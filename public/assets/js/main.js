// Navigation Menu Toggle Logic
const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector("nav ul");
const navbar = document.querySelector("nav");

if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("is-open");
        navToggle.classList.toggle("active", isOpen);
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navList.addEventListener("click", (event) => {
        if (event.target.tagName === "A" && navList.classList.contains("is-open")) {
            navList.classList.remove("is-open");
            navToggle.classList.remove("active");
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

    // Invoice elements inside modal
    const receiptInvoice = document.getElementById("receipt-invoice");
    const receiptRefId = document.getElementById("receipt-ref-id");
    const receiptServiceName = document.getElementById("receipt-service-name");
    const receiptServicePrice = document.getElementById("receipt-service-price");
    const receiptAddonsRow = document.getElementById("receipt-addons-row");
    const receiptAddonsNames = document.getElementById("receipt-addons-names");
    const receiptAddonsPrice = document.getElementById("receipt-addons-price");
    const receiptDiscountRow = document.getElementById("receipt-discount-row");
    const receiptDiscountPrice = document.getElementById("receipt-discount-price");
    const receiptFinalPrice = document.getElementById("receipt-final-price");
    const receiptStylistName = document.getElementById("receipt-stylist-name");
    const receiptDate = document.getElementById("receipt-date");
    const receiptTime = document.getElementById("receipt-time");

    // Global variables for billing calculations
    let servicesCatalog = [];
    let activeServicePrice = 0;
    let activeAddonsPrice = 0;
    let activeDiscount = 0;
    let promoCodeString = "";

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
            
            servicesCatalog = services; // Save globally

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
            if (receiptInvoice) receiptInvoice.style.display = "none"; // Hide receipt if error
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

    // Recalculate Live Invoice Totals
    function recalculateTotal() {
        const baseSpan = document.getElementById("summary-base");
        const addonsRow = document.getElementById("summary-addons-row");
        const addonsSpan = document.getElementById("summary-addons");
        const discountRow = document.getElementById("summary-discount-row");
        const discountSpan = document.getElementById("summary-discount");
        const totalSpan = document.getElementById("summary-total");
        const priceSummary = document.getElementById("price-summary");

        if (activeServicePrice === 0) {
            priceSummary.style.display = "none";
            return;
        }

        priceSummary.style.display = "block";
        baseSpan.textContent = `$${activeServicePrice.toFixed(2)}`;

        if (activeAddonsPrice > 0) {
            addonsRow.style.display = "flex";
            addonsSpan.textContent = `+$${activeAddonsPrice.toFixed(2)}`;
        } else {
            addonsRow.style.display = "none";
        }

        if (activeDiscount > 0) {
            discountRow.style.display = "flex";
            discountSpan.textContent = `-$${activeDiscount.toFixed(2)}`;
        } else {
            discountRow.style.display = "none";
        }

        const total = activeServicePrice + activeAddonsPrice - activeDiscount;
        totalSpan.textContent = `$${total.toFixed(2)}`;
    }

    // Dropdown change trigger to update pricing
    if (serviceSelect) {
        serviceSelect.addEventListener("change", () => {
            const serviceId = Number(serviceSelect.value);
            const service = servicesCatalog.find(s => s.id === serviceId);
            if (service) {
                activeServicePrice = service.price;
                applyPromoLogic(false); // Recalculate discount silently if code entered
                recalculateTotal();
            }
        });
    }

    // Addons checkbox calculation triggers
    const addonCheckboxes = document.querySelectorAll('input[name="addons"]');
    addonCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            let sum = 0;
            document.querySelectorAll('input[name="addons"]:checked').forEach(checkedCb => {
                sum += Number(checkedCb.dataset.price);
            });
            activeAddonsPrice = sum;
            recalculateTotal();
        });
    });

    // Promo Code Application Logic
    const promoInput = document.getElementById("booking-promo");
    const applyPromoBtn = document.getElementById("apply-promo-btn");

    function applyPromoLogic(shouldAlert = true) {
        if (!promoInput) return;
        const code = promoInput.value.trim().toUpperCase();

        if (activeServicePrice === 0) {
            if (shouldAlert) showModal(false, "Select Service", "Please select a hair service before applying a promo code.");
            return;
        }

        if (code === "") {
            activeDiscount = 0;
            promoCodeString = "";
            promoInput.style.borderColor = "";
            recalculateTotal();
            return;
        }

        if (code === "WELCOME10") {
            activeDiscount = activeServicePrice * 0.10;
            promoCodeString = "WELCOME10";
            promoInput.style.borderColor = "#10b981";
            if (shouldAlert) showModal(true, "Promo Applied!", "10% off has been applied to your base styling service.");
        } else if (code === "GOLD15") {
            activeDiscount = activeServicePrice * 0.15;
            promoCodeString = "GOLD15";
            promoInput.style.borderColor = "#10b981";
            if (shouldAlert) showModal(true, "Promo Applied!", "15% off has been applied to your base styling service.");
        } else {
            activeDiscount = 0;
            promoCodeString = "";
            promoInput.style.borderColor = "#ef4444";
            if (shouldAlert) showModal(false, "Invalid Code", "The entered promo code does not exist or has expired.");
        }
        recalculateTotal();
    }

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener("click", () => applyPromoLogic(true));
    }

    // ==========================================
    // MULTI-STEP BOOKING WIZARD NAVIGATION
    // ==========================================
    let currentStep = 1;
    const steps = document.querySelectorAll(".booking-step");
    const stepIndicators = document.querySelectorAll(".step-indicator");

    function showStep(stepNum) {
        currentStep = stepNum;
        steps.forEach((step, idx) => {
            step.classList.toggle("active", idx + 1 === stepNum);
        });

        stepIndicators.forEach((indicator, idx) => {
            const stepIdx = idx + 1;
            indicator.classList.toggle("active", stepIdx === stepNum);
            indicator.classList.toggle("completed", stepIdx < stepNum);
        });
    }

    // Step 1 Next Trigger
    const step1Next = document.getElementById("step1-next-btn");
    if (step1Next) {
        step1Next.addEventListener("click", () => {
            if (!serviceSelect.value) {
                showModal(false, "Selection Missing", "Please select a styling service from the list before proceeding.");
                return;
            }
            showStep(2);
        });
    }

    // Step 2 Next & Back Triggers
    const step2Back = document.getElementById("step2-back-btn");
    const step2Next = document.getElementById("step2-next-btn");
    if (step2Back) {
        step2Back.addEventListener("click", () => {
            showStep(1);
        });
    }
    if (step2Next) {
        step2Next.addEventListener("click", () => {
            if (!stylistSelect.value || !dateInput.value) {
                showModal(false, "Selection Missing", "Please select both a stylist and an appointment date.");
                return;
            }
            if (!timeHiddenInput.value) {
                showModal(false, "Time Slot Missing", "Please pick one of the available time slots before proceeding.");
                return;
            }
            showStep(3);
        });
    }

    // Step 3 Back Trigger
    const step3Back = document.getElementById("step3-back-btn");
    if (step3Back) {
        step3Back.addEventListener("click", () => {
            showStep(2);
        });
    }

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

            // Gather selected addons
            const selectedAddons = Array.from(document.querySelectorAll('input[name="addons"]:checked'))
                .map(el => el.value)
                .join(', ');

            const finalTotal = activeServicePrice + activeAddonsPrice - activeDiscount;

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
                        time,
                        promo_code: promoCodeString || null,
                        discount_applied: activeDiscount,
                        add_ons: selectedAddons || null,
                        total_price: finalTotal
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Populate Invoice Receipt elements inside success popup
                    const refId = 'MDB-' + Math.floor(1000 + Math.random() * 9000);
                    if (receiptRefId) receiptRefId.textContent = `REF: ${refId}`;

                    const selectedService = serviceSelect.options[serviceSelect.selectedIndex].textContent.split(" ($")[0];
                    if (receiptServiceName) receiptServiceName.textContent = selectedService;
                    if (receiptServicePrice) receiptServicePrice.textContent = `$${activeServicePrice.toFixed(2)}`;

                    if (selectedAddons) {
                        if (receiptAddonsRow) receiptAddonsRow.style.display = "flex";
                        if (receiptAddonsNames) receiptAddonsNames.textContent = selectedAddons;
                        if (receiptAddonsPrice) receiptAddonsPrice.textContent = `+$${activeAddonsPrice.toFixed(2)}`;
                    } else {
                        if (receiptAddonsRow) receiptAddonsRow.style.display = "none";
                    }

                    if (activeDiscount > 0) {
                        if (receiptDiscountRow) receiptDiscountRow.style.display = "flex";
                        if (receiptDiscountPrice) receiptDiscountPrice.textContent = `-$${activeDiscount.toFixed(2)}`;
                    } else {
                        if (receiptDiscountRow) receiptDiscountRow.style.display = "none";
                    }

                    if (receiptFinalPrice) receiptFinalPrice.textContent = `$${finalTotal.toFixed(2)}`;

                    const selectedStylistName = stylistSelect.options[stylistSelect.selectedIndex].textContent.split(" - ")[0];
                    if (receiptStylistName) receiptStylistName.textContent = selectedStylistName;

                    // Readable date
                    const [year, month, day] = date.split("-");
                    const dateObj = new Date(year, month - 1, day);
                    const readableDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                    if (receiptDate) receiptDate.textContent = readableDate;
                    if (receiptTime) receiptTime.textContent = formatTimeLabel(time);

                    if (receiptInvoice) receiptInvoice.style.display = "block"; // Show invoice card

                    showModal(
                        true, 
                        "Booking Request Received!", 
                        `Thank you ${name}! Your styling session is requested. We have generated your receipt below.`
                    );
                    
                    // Reset form and variables
                    bookingForm.reset();
                    activeServicePrice = 0;
                    activeAddonsPrice = 0;
                    activeDiscount = 0;
                    promoCodeString = "";
                    if (promoInput) promoInput.style.borderColor = "";
                    recalculateTotal();

                    timeSlotsGrid.innerHTML = '<span class="slots-placeholder">Please select a stylist and date first.</span>';
                    timeSlotsContainer.classList.remove("show");
                    
                    // Reset wizard back to step 1
                    showStep(1);

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

    // ==========================================
    // DYNAMIC TESTIMONIAL REVIEWS SYSTEM
    // ==========================================

    const reviewsGrid = document.getElementById("testimonials-grid");
    const writeReviewBtn = document.getElementById("open-review-modal-btn");
    const reviewModal = document.getElementById("review-modal");
    const reviewForm = document.getElementById("review-form");
    const closeReviewModalSpan = document.querySelector(".close-review-modal");

    // Fetch and render reviews
    async function loadReviews() {
        if (!reviewsGrid) return;
        reviewsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Loading reviews...</p>';

        const toggleReviewsBtn = document.getElementById("toggle-all-reviews-btn");
        if (toggleReviewsBtn) toggleReviewsBtn.style.display = "none";

        try {
            const res = await fetch("/api/reviews");
            const reviews = await res.json();
            
            reviewsGrid.innerHTML = "";

            if (reviews.length === 0) {
                reviewsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; font-style: italic; padding: 2rem;">No reviews yet. Be the first to share your experience!</p>';
                return;
            }

            reviews.forEach((review, idx) => {
                const parts = review.name.split(" ");
                const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2) || "P";
                
                const starString = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

                const card = document.createElement("div");
                card.className = "testimonial-card";
                
                // Hide reviews after the first 3
                if (idx >= 3) {
                    card.classList.add("hidden-review");
                    card.style.display = "none";
                }

                card.innerHTML = `
                    <div class="rating">${starString}</div>
                    <blockquote>
                        <p>"${review.comment}"</p>
                    </blockquote>
                    <div class="client-info">
                        <div class="client-avatar">${initials}</div>
                        <div class="client-details">
                            <strong>${review.name}</strong>
                            <span>Verified Patron</span>
                        </div>
                    </div>
                `;
                reviewsGrid.appendChild(card);
            });

            // Show expand button if there are more than 3 reviews
            if (reviews.length > 3 && toggleReviewsBtn) {
                toggleReviewsBtn.style.display = "inline-block";
            }
        } catch (err) {
            console.error("Failed to load reviews catalog:", err);
            reviewsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff5555; font-style: italic;">Failed to load reviews.</p>';
        }
    }

    // Toggle reviews expansion listener
    const toggleReviewsBtn = document.getElementById("toggle-all-reviews-btn");
    if (toggleReviewsBtn) {
        toggleReviewsBtn.addEventListener("click", () => {
            const hiddenReviews = document.querySelectorAll(".hidden-review");
            hiddenReviews.forEach(el => {
                el.style.display = "block";
            });
            toggleReviewsBtn.style.display = "none";
        });
    }

    // Modal triggers for reviews
    if (writeReviewBtn && reviewModal) {
        writeReviewBtn.addEventListener("click", () => {
            reviewModal.style.display = "block";
        });
    }

    if (closeReviewModalSpan) {
        closeReviewModalSpan.addEventListener("click", () => {
            reviewModal.style.display = "none";
        });
    }

    // Submit Review
    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("review-name").value.trim();
            const ratingVal = document.querySelector('input[name="rating"]:checked');
            const comment = document.getElementById("review-comment").value.trim();

            if (!ratingVal) {
                alert("Please select a star rating.");
                return;
            }

            const rating = Number(ratingVal.value);

            try {
                const res = await fetch("/api/reviews", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, rating, comment })
                });

                const result = await res.json();

                if (res.ok) {
                    if (reviewModal) reviewModal.style.display = "none";
                    reviewForm.reset();
                    showModal(true, "Review Submitted!", "Thank you for sharing your experience with Maison de Beauté!");
                    loadReviews(); // Reload testimonials list
                } else {
                    alert(result.error || "Failed to submit review.");
                }
            } catch (err) {
                console.error("Error submitting review:", err);
                alert("Server connection error. Please try again.");
            }
        });
    }

    // Before/After comparison slider modal logic
    const portfolioModal = document.getElementById("portfolio-modal");
    const viewPortfolioBtns = document.querySelectorAll(".view-portfolio-btn");
    const closePortfolioModalSpan = document.querySelector(".close-portfolio-modal");
    const sliderDivider = document.getElementById("slider-divider-range");
    const afterImageContainer = document.querySelector(".after-image");
    const sliderHandleBar = document.querySelector(".slider-handle-bar");
    const sliderBeforeImg = document.getElementById("slider-before-img");
    const sliderAfterImg = document.getElementById("slider-after-img");
    const portfolioTitle = document.getElementById("portfolio-title");

    // Pre-configured before/after works for stylists (using assets already in the repo)
    const portfolios = {
        alice: {
            title: "Alice's Work: Premium Hair Nourishment",
            before: "assets/images/hair3.jpeg", // hair treatment
            after: "assets/images/hair1.jpg"   // stylish styling result
        },
        michael: {
            title: "Michael's Work: Precision Color Highlights",
            before: "assets/images/hair2.jpeg", // coloring coloring
            after: "assets/images/hair1.jpg"   // completed styling
        }
    };

    if (viewPortfolioBtns.length > 0 && portfolioModal) {
        viewPortfolioBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const stylistKey = btn.dataset.stylist;
                const config = portfolios[stylistKey];
                
                if (config) {
                    portfolioTitle.textContent = config.title;
                    sliderBeforeImg.src = config.before;
                    sliderAfterImg.src = config.after;
                    
                    // Reset divider range position to 50%
                    if (sliderDivider) {
                        sliderDivider.value = 50;
                        updateSliderPosition(50);
                    }
                    
                    portfolioModal.style.display = "block";
                }
            });
        });
    }

    function updateSliderPosition(value) {
        if (afterImageContainer && sliderHandleBar) {
            afterImageContainer.style.clipPath = `polygon(${value}% 0, 100% 0, 100% 100%, ${value}% 100%)`;
            sliderHandleBar.style.left = `${value}%`;
        }
    }

    if (sliderDivider) {
        sliderDivider.addEventListener("input", (e) => {
            updateSliderPosition(e.target.value);
        });
    }

    if (closePortfolioModalSpan) {
        closePortfolioModalSpan.addEventListener("click", () => {
            portfolioModal.style.display = "none";
        });
    }

    // Global click listener to close modals
    window.addEventListener("click", (e) => {
        if (e.target === portfolioModal) {
            portfolioModal.style.display = "none";
        }
        if (e.target === reviewModal) {
            reviewModal.style.display = "none";
        }
    });

    // Scroll Reveal IntersectionObserver
    const revealSections = document.querySelectorAll(".scroll-reveal");
    if (revealSections.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
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
    loadReviews(); // Load database testimonials on load
});
