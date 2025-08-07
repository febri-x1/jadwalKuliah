
        // Function to save attendance state and class modes to localStorage
        function saveState() {
            const attendance = {};
            const classModes = {};

            document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                const subject = checkbox.dataset.subject;
                const meeting = checkbox.dataset.meeting;
                if (!attendance[subject]) {
                    attendance[subject] = {};
                }
                attendance[subject][meeting] = checkbox.checked;
            });
            localStorage.setItem('kuliahAttendance', JSON.stringify(attendance));

            document.querySelectorAll('.class-mode-select').forEach(select => {
                const subject = select.dataset.subject;
                const meeting = select.dataset.meeting;
                if (!classModes[subject]) {
                    classModes[subject] = {};
                }
                classModes[subject][meeting] = select.value;
            });
            localStorage.setItem('kuliahClassModes', JSON.stringify(classModes));

            updateAbsenceSummary(); // Update summary after saving
        }

        // Function to load attendance state and class modes from localStorage
        function loadState() {
            const savedAttendance = localStorage.getItem('kuliahAttendance');
            if (savedAttendance) {
                const attendance = JSON.parse(savedAttendance);
                document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                    const subject = checkbox.dataset.subject;
                    const meeting = checkbox.dataset.meeting;
                    if (attendance[subject] && attendance[subject][meeting] !== undefined) {
                        checkbox.checked = attendance[subject][meeting];
                    }
                });
            }

            const savedClassModes = localStorage.getItem('kuliahClassModes');
            if (savedClassModes) {
                const classModes = JSON.parse(savedClassModes);
                document.querySelectorAll('.class-mode-select').forEach(select => {
                    const subject = select.dataset.subject;
                    const meeting = select.dataset.meeting;
                    if (classModes[subject] && classModes[subject][meeting]) {
                        select.value = classModes[subject][meeting];
                    }
                });
            }
        }

        // Function to update the absence summary
        function updateAbsenceSummary() {
            const absenceData = {}; // { "Mata Kuliah": { total: 16, attended: 0, absent: 0 } }

            // Initialize all subjects with 0 attended and 0 absent
            const allSubjects = new Set();
            document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                allSubjects.add(checkbox.dataset.subject);
            });

            allSubjects.forEach(subject => {
                absenceData[subject] = { total: 16, attended: 0, absent: 0 };
            });

            // Count attended meetings
            document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                const subject = checkbox.dataset.subject;
                if (checkbox.checked) {
                    absenceData[subject].attended++;
                }
            });

            // Calculate absences
            for (const subject in absenceData) {
                absenceData[subject].absent = absenceData[subject].total - absenceData[subject].attended;
            }

            const summaryDiv = document.getElementById('absenceSummary');
            if (!summaryDiv) return; // Defensive check

            let summaryHtml = '<h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Ringkasan Ketidakhadiran</h2>';
            summaryHtml += '<ul class="list-disc list-inside space-y-2">';
            let hasAbsences = false;

            for (const subject in absenceData) {
                if (absenceData[subject].absent > 0) {
                    hasAbsences = true;
                    summaryHtml += `<li class="text-lg text-gray-700"><span class="font-semibold">${subject}</span>: ${absenceData[subject].absent} kali tidak hadir</li>`;
                }
            }

            if (!hasAbsences) {
                summaryHtml += '<li class="text-lg text-gray-700 text-center">Tidak ada ketidakhadiran tercatat. Bagus sekali!</li>';
            }
            summaryHtml += '</ul>';
            summaryDiv.innerHTML = summaryHtml;
        }


        // Add event listeners to all checkboxes and select elements to save state on change
        document.addEventListener('DOMContentLoaded', () => {
            loadState(); // Load all saved state when the page loads
            updateAbsenceSummary(); // Initial summary update

            document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', saveState);
            });

            document.querySelectorAll('.class-mode-select').forEach(select => {
                select.addEventListener('change', saveState);
            });

            // Reset button functionality
            document.getElementById('resetButton').addEventListener('click', () => {
                const confirmation = confirm("Apakah Anda yakin ingin mereset semua data kehadiran dan mode kelas?");
                if (confirmation) {
                    document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    document.querySelectorAll('.class-mode-select').forEach(select => {
                        select.value = "Offline"; // Reset to default
                    });
                    saveState(); // Save the cleared state and trigger summary update
                    alert("Data kehadiran dan mode kelas telah direset.");
                }
            });

            // Copy to clipboard functionality
            document.getElementById('copyButton').addEventListener('click', () => {
                let csvContent = "Hari,Mata Kuliah,Jam,Dosen,Ruang";
                for (let i = 1; i <= 16; i++) {
                    csvContent += ",Pertemuan " + i + " (Kehadiran),Pertemuan " + i + " (Mode)";
                }
                csvContent += "\n";

                const rows = document.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    // Skip the "KELAS MALAM SI 6" header row
                    if (row.querySelector('td[colspan="21"]')) { // colspan updated
                        return;
                    }

                    const cells = row.querySelectorAll('td');
                    let rowData = [];
                    // Extract fixed data (Day, Subject, Time, Lecturer, Room)
                    for (let i = 0; i < 5; i++) {
                        rowData.push('"' + cells[i].textContent.trim().replace(/"/g, '""') + '"');
                    }
                    // Extract Attendance and Class Mode for each meeting
                    for (let i = 5; i < cells.length; i++) { // Start from index 5 for meeting cells
                        const checkbox = cells[i].querySelector('.attendance-checkbox');
                        const select = cells[i].querySelector('.class-mode-select');
                        let attendanceStatus = checkbox.checked ? "Hadir" : "Tidak Hadir";
                        let classMode = select ? select.value : "";
                        rowData.push('"' + attendanceStatus + '","' + classMode + '"');
                    }
                    csvContent += rowData.join(",") + "\n";
                });

                // Use document.execCommand for clipboard copy due to iframe limitations
                const textarea = document.createElement('textarea');
                textarea.value = csvContent;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    alert('Jadwal, mode kelas, dan kehadiran berhasil disalin ke clipboard dalam format CSV!');
                } catch (err) {
                    console.error('Gagal menyalin ke clipboard:', err);
                    alert('Gagal menyalin ke clipboard. Silakan coba secara manual.');
                }
                document.body.removeChild(textarea);
            });
        });
