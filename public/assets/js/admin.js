// Admin Dashboard Logic

document.addEventListener("DOMContentLoaded", () => {
    // Session state
    let cachedBookings = [];
    let cachedStylists = [];
    let cachedServices = [];

    // Top Level Elements
    const loggedAdminUserSpan = document.getElementById("logged-admin-user");
    const adminLogoutBtn = document.getElementById("admin-logout-btn");
    const toast = document.getElementById("toast");

    // Metrics Elements
    const metricTotal = document.getElementById("metric-total");
    const metricPending = document.getElementById("metric-pending");
    const metricRevenue = document.getElementById("metric-revenue");
    const metricStylists = document.getElementById("metric-stylists");

    // Filters Elements
    const filterDate = document.getElementById("filter-date");
    const filterStylist = document.getElementById("filter-stylist");
    const filterStatus = document.getElementById("filter-status");
    const bookingsTableBody = document.getElementById("bookings-table-body");

    // Catalog Managers Containers
    const servicesListContainer = document.getElementById("services-list-container");
    const stylistsListContainer = document.getElementById("stylists-list-container");

    // Forms
    const addServiceForm = document.getElementById("add-service-form");
    const addStylistForm = document.getElementById("add-stylist-form");
    const changePasswordForm = document.getElementById("change-password-form");

    // Check Admin Session Status on load
    async function checkAuth() {
        try {
            const res = await fetch("/api/admin/status");
            const data = await res.json();
            
            if (!data.loggedIn) {
                // Redirect unauthorized users to login page
                window.location.href = "login.html";
            } else {
                loggedAdminUserSpan.textContent = `Logged in as: ${data.username}`;
                initializeDashboard();
            }
        } catch (err) {
            console.error("Auth status verification failed:", err);
            window.location.href = "login.html";
        }
    }

    // Initialize Dashboard data loading
    async function initializeDashboard() {
        setupTabs();
        await refreshCatalogs(); // Load services and stylists first
        await refreshBookings();  // Load bookings second (requires service/stylist info for metrics)
        setupForms();
        setupFilters();
    }

    // Toast Notification helper
    function showToast(message, type = "success") {
        if (!toast) return;
        toast.textContent = message;
        toast.className = `notification-toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3500);
    }

    // Tab Navigation setup
    function setupTabs() {
        const tabs = document.querySelectorAll(".tab-btn");
        const sections = document.querySelectorAll(".tab-content");

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const targetTabId = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove("active"));
                sections.forEach(s => s.classList.remove("active"));

                tab.classList.add("active");
                const targetSection = document.getElementById(targetTabId);
                if (targetSection) targetSection.classList.add("active");
            });
        });
    }

    // Forms event handlers
    function setupForms() {
        // Logout handler
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener("click", async () => {
                try {
                    const res = await fetch("/api/admin/logout", { method: "POST" });
                    if (res.ok) {
                        window.location.href = "/";
                    } else {
                        showToast("Logout failed.", "error");
                    }
                } catch (e) {
                    showToast("Server communication issue.", "error");
                }
            });
        }

        // Add Service Form
        if (addServiceForm) {
            addServiceForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("service-name").value.trim();
                const price = parseFloat(document.getElementById("service-price").value);
                const duration = parseInt(document.getElementById("service-duration").value);
                const description = document.getElementById("service-desc").value.trim();

                try {
                    const res = await fetch("/api/admin/services", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, price, duration, description })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        showToast(`Service "${name}" added successfully.`);
                        addServiceForm.reset();
                        await refreshCatalogs();
                    } else {
                        showToast(data.error || "Failed to add service.", "error");
                    }
                } catch (err) {
                    showToast("Failed to communicate with server.", "error");
                }
            });
        }

        // Add Stylist Form
        if (addStylistForm) {
            addStylistForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("stylist-name").value.trim();
                const specialty = document.getElementById("stylist-specialty").value.trim();
                const image_url = document.getElementById("stylist-image").value.trim();

                try {
                    const res = await fetch("/api/admin/stylists", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, specialty, image_url })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        showToast(`Stylist "${name}" added successfully.`);
                        addStylistForm.reset();
                        document.getElementById("stylist-image").value = "assets/images/logo.png";
                        await refreshCatalogs();
                    } else {
                        showToast(data.error || "Failed to add stylist.", "error");
                    }
                } catch (err) {
                    showToast("Failed to communicate with server.", "error");
                }
            });
        }

        // Change Admin Password Form
        if (changePasswordForm) {
            changePasswordForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const oldPassword = document.getElementById("old-password").value;
                const newPassword = document.getElementById("new-password").value;
                const newPasswordConfirm = document.getElementById("new-password-confirm").value;

                if (newPassword !== newPasswordConfirm) {
                    showToast("New passwords do not match.", "error");
                    return;
                }

                try {
                    const res = await fetch("/api/admin/change-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ oldPassword, newPassword })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        showToast("Password updated successfully.");
                        changePasswordForm.reset();
                    } else {
                        showToast(data.error || "Failed to change password.", "error");
                    }
                } catch (err) {
                    showToast("Server request failed.", "error");
                }
            });
        }
    }

    // Refresh services and stylists in memory and layouts
    async function refreshCatalogs() {
        try {
            // Load Stylists list
            const stylistRes = await fetch("/api/stylists");
            cachedStylists = await stylistRes.json();
            
            // Load Services list
            const serviceRes = await fetch("/api/services");
            cachedServices = await serviceRes.json();

            renderServices();
            renderStylists();
            updateFilterDropdowns();
            
            // Update stylist metric card count
            if (metricStylists) metricStylists.textContent = cachedStylists.length;
        } catch (err) {
            console.error("Error updating catalog databases:", err);
            showToast("Error updating catalog listings.", "error");
        }
    }

    // Populates stylist filter options
    function updateFilterDropdowns() {
        if (!filterStylist) return;
        
        // Keep "All Stylists" option
        filterStylist.innerHTML = '<option value="">All Stylists</option>';
        cachedStylists.forEach(stylist => {
            const opt = document.createElement("option");
            opt.value = stylist.name; // Match against name in combined record
            opt.textContent = stylist.name;
            filterStylist.appendChild(opt);
        });
    }

    // Render Services in Panel
    function renderServices() {
        if (!servicesListContainer) return;
        servicesListContainer.innerHTML = "";

        if (cachedServices.length === 0) {
            servicesListContainer.innerHTML = '<p style="color: #888; font-style: italic;">No services configured.</p>';
            return;
        }

        cachedServices.forEach(service => {
            const item = document.createElement("div");
            item.className = "catalog-item";
            item.innerHTML = `
                <div class="catalog-item-info">
                    <h4>${service.name}</h4>
                    <p>$${service.price.toFixed(2)} &bull; ${service.duration} mins</p>
                </div>
                <button class="delete-icon-btn" title="Delete Service" data-id="${service.id}">&times;</button>
            `;

            // Delete click listener
            item.querySelector(".delete-icon-btn").addEventListener("click", () => {
                deleteService(service.id, service.name);
            });

            servicesListContainer.appendChild(item);
        });
    }

    // Render Stylists in Panel
    function renderStylists() {
        if (!stylistsListContainer) return;
        stylistsListContainer.innerHTML = "";

        if (cachedStylists.length === 0) {
            stylistsListContainer.innerHTML = '<p style="color: #888; font-style: italic;">No stylists configured.</p>';
            return;
        }

        cachedStylists.forEach(stylist => {
            const item = document.createElement("div");
            item.className = "catalog-item";
            item.innerHTML = `
                <div class="catalog-item-info">
                    <h4>${stylist.name}</h4>
                    <p>${stylist.specialty}</p>
                </div>
                <button class="delete-icon-btn" title="Delete Stylist" data-id="${stylist.id}">&times;</button>
            `;

            // Delete click listener
            item.querySelector(".delete-icon-btn").addEventListener("click", () => {
                deleteStylist(stylist.id, stylist.name);
            });

            stylistsListContainer.appendChild(item);
        });
    }

    // Service deletion api call
    async function deleteService(id, name) {
        if (!confirm(`Are you sure you want to delete service "${name}"? This will cancel any associated appointments.`)) return;

        try {
            const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                showToast(`Service "${name}" was deleted.`);
                await refreshCatalogs();
                await refreshBookings(); // Relook up bookings as foreign keys might cascade delete or change
            } else {
                showToast(data.error || "Failed to delete service.", "error");
            }
        } catch (e) {
            showToast("Server request failed.", "error");
        }
    }

    // Stylist deletion api call
    async function deleteStylist(id, name) {
        if (!confirm(`Are you sure you want to delete stylist "${name}"? This will cancel any associated appointments.`)) return;

        try {
            const res = await fetch(`/api/admin/stylists/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                showToast(`Stylist "${name}" was deleted.`);
                await refreshCatalogs();
                await refreshBookings();
            } else {
                showToast(data.error || "Failed to delete stylist.", "error");
            }
        } catch (e) {
            showToast("Server request failed.", "error");
        }
    }

    // Bookings Filters setup
    function setupFilters() {
        if (filterDate) filterDate.addEventListener("input", renderBookings);
        if (filterStylist) filterStylist.addEventListener("change", renderBookings);
        if (filterStatus) filterStatus.addEventListener("change", renderBookings);
    }

    // Fetch Bookings list
    async function refreshBookings() {
        try {
            const res = await fetch("/api/admin/bookings");
            if (res.ok) {
                cachedBookings = await res.json();
                renderBookings();
                calculateMetrics();
            } else {
                bookingsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #ff5555;">Unauthorized access. Please log in again.</td></tr>';
            }
        } catch (err) {
            console.error("Error retrieving bookings:", err);
            bookingsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #ff5555;">Server communications error.</td></tr>';
        }
    }

    // Formats time strings (e.g. "14:00" -> "2:00 PM")
    function formatTimeLabel(timeStr) {
        const [hour, minute] = timeStr.split(":").map(Number);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute < 10 ? "0" + minute : minute} ${ampm}`;
    }

    // Render bookings table filtered locally
    function renderBookings() {
        if (!bookingsTableBody) return;
        bookingsTableBody.innerHTML = "";

        const dateVal = filterDate.value;
        const stylistVal = filterStylist.value;
        const statusVal = filterStatus.value;

        // Apply filters
        const filtered = cachedBookings.filter(b => {
            if (dateVal && b.booking_date !== dateVal) return false;
            if (stylistVal && b.stylist_name !== stylistVal) return false;
            if (statusVal && b.status !== statusVal) return false;
            return true;
        });

        if (filtered.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #888; font-style: italic; padding: 2rem;">No matching appointments found.</td></tr>';
            calculateCommissions();
            return;
        }

        filtered.forEach(booking => {
            const tr = document.createElement("tr");
            
            // Format dates "YYYY-MM-DD" into readable format
            const [year, month, day] = booking.booking_date.split("-");
            const dateObj = new Date(year, month - 1, day);
            const readableDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const readableTime = formatTimeLabel(booking.booking_time);

            tr.innerHTML = `
                <td>
                    <div style="font-weight: bold; color: white;">${booking.customer_name}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">${booking.customer_email}</div>
                    <div style="font-size: 0.85rem; color: #aaa;">${booking.customer_phone}</div>
                </td>
                <td>
                    <div style="font-weight: 500;">${booking.service_name}</div>
                    <div style="font-size: 0.8rem; color: #888;">$${booking.service_price.toFixed(2)}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: #ddd;">${booking.add_ons || 'None'}</div>
                </td>
                <td>
                    <span style="font-size: 0.8rem; font-weight: 700; color: ${booking.promo_code ? 'var(--gold)' : '#888'};">${booking.promo_code || 'None'}</span>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--status-completed);">$${booking.total_price.toFixed(2)}</div>
                </td>
                <td>
                    <div>${booking.stylist_name}</div>
                </td>
                <td>
                    <div>${readableDate}</div>
                    <div style="font-size: 0.8rem; color: #ccc;">${readableTime}</div>
                </td>
                <td>
                    <span class="badge ${booking.status}">${booking.status}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center;">
                        <select class="action-select" data-id="${booking.id}">
                            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button class="delete-icon-btn" title="Delete Booking" data-id="${booking.id}">&times;</button>
                    </div>
                </td>
            `;

            // Action: Change Status handler
            tr.querySelector(".action-select").addEventListener("change", async (e) => {
                await updateBookingStatus(booking.id, e.target.value);
            });

            // Action: Delete Handler
            tr.querySelector(".delete-icon-btn").addEventListener("click", async () => {
                await deleteBooking(booking.id, booking.customer_name);
            });

            bookingsTableBody.appendChild(tr);
        });

        calculateCommissions();
    }

    // Calculate and render stylist commissions payouts (50% Split)
    function calculateCommissions() {
        const commissionsTableBody = document.getElementById("commissions-table-body");
        if (!commissionsTableBody) return;
        commissionsTableBody.innerHTML = "";

        if (cachedStylists.length === 0) {
            commissionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888; font-style: italic;">No stylists configured.</td></tr>';
            return;
        }

        cachedStylists.forEach(stylist => {
            // Find completed bookings for this stylist
            const completedBookings = cachedBookings.filter(b => b.stylist_id === stylist.id && b.status === "completed");
            
            const completedCount = completedBookings.length;
            const totalServiceSales = completedBookings.reduce((sum, b) => sum + Number(b.service_price), 0);
            const commissionPayout = totalServiceSales * 0.50; // 50% split on base services

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><div style="font-weight: bold; color: white;">${stylist.name}</div></td>
                <td><div style="font-size: 0.85rem; color: #aaa;">${stylist.specialty}</div></td>
                <td><div>${completedCount}</div></td>
                <td><div style="font-weight: 600; color: var(--status-completed);">$${totalServiceSales.toFixed(2)}</div></td>
                <td><div style="font-weight: 700; color: var(--gold); text-shadow: 0 0 5px rgba(252,211,77,0.2);">$${commissionPayout.toFixed(2)}</div></td>
            `;
            commissionsTableBody.appendChild(tr);
        });
    }

    // Call update status endpoint
    async function updateBookingStatus(id, newStatus) {
        try {
            const res = await fetch(`/api/admin/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`Appointment status updated to ${newStatus}.`);
                await refreshBookings();
            } else {
                showToast(data.error || "Failed to update booking status.", "error");
            }
        } catch (e) {
            showToast("Server communication error.", "error");
        }
    }

    // Call delete booking endpoint
    async function deleteBooking(id, customerName) {
        if (!confirm(`Are you sure you want to delete the booking for "${customerName}"?`)) return;

        try {
            const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                showToast("Booking deleted successfully.");
                await refreshBookings();
            } else {
                showToast(data.error || "Failed to delete booking.", "error");
            }
        } catch (e) {
            showToast("Server communication error.", "error");
        }
    }

    // Calculate Dashboard metrics from memory
    function calculateMetrics() {
        if (cachedBookings.length === 0) {
            if (metricTotal) metricTotal.textContent = 0;
            if (metricPending) metricPending.textContent = 0;
            if (metricRevenue) metricRevenue.textContent = "$0.00";
            return;
        }

        const total = cachedBookings.length;
        const pending = cachedBookings.filter(b => b.status === "pending").length;
        
        // Calculate revenue only from COMPLETED appointments (using the final total_price)
        const revenue = cachedBookings
            .filter(b => b.status === "completed")
            .reduce((sum, b) => sum + (b.total_price || 0), 0);

        if (metricTotal) metricTotal.textContent = total;
        if (metricPending) metricPending.textContent = pending;
        if (metricRevenue) metricRevenue.textContent = `$${revenue.toFixed(2)}`;
    }

    // Start verification
    checkAuth();
});
