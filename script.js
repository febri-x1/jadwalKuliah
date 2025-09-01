// Function to save attendance state and class modes to localStorage
        function saveState() {
            const attendance = {};
            const classModes = {};

            document.querySelectorAll('.attendance-select').forEach(select => {
                const subject = select.dataset.subject;
                const meeting = select.dataset.meeting;
                if (!attendance[subject]) {
                    attendance[subject] = {};
                }
                attendance[subject][meeting] = select.value;
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
                document.querySelectorAll('.attendance-select').forEach(select => {
                    const subject = select.dataset.subject;
                    const meeting = select.dataset.meeting;
                    if (attendance[subject] && attendance[subject][meeting]) {
                        select.value = attendance[subject][meeting];
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
            const attendanceData = {}; // { "Mata Kuliah": { total: 16, hadir: 0, sakit: 0, izin: 0, tidakHadir: 0 } }

            // Initialize all subjects
            const allSubjects = new Set();
            document.querySelectorAll('.attendance-select').forEach(select => {
                allSubjects.add(select.dataset.subject);
            });

            allSubjects.forEach(subject => {
                attendanceData[subject] = { total: 16, hadir: 0, sakit: 0, izin: 0, tidakHadir: 0 };
            });

            // Count attendance statuses
            document.querySelectorAll('.attendance-select').forEach(select => {
                const subject = select.dataset.subject;
                const status = select.value;
                if (status === "Hadir") {
                    attendanceData[subject].hadir++;
                } else if (status === "Sakit") {
                    attendanceData[subject].sakit++;
                } else if (status === "Izin") {
                    attendanceData[subject].izin++;
                } else if (status === "Tidak Hadir") {
                    attendanceData[subject].tidakHadir++;
                }
            });

            const summaryDiv = document.getElementById('absenceSummary');
            if (!summaryDiv) return; // Defensive check

            let summaryHtml = '<h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Ringkasan Kehadiran</h2>';
            summaryHtml += '<ul class="list-disc list-inside space-y-2">';
            let hasAnyStatus = false;

            for (const subject in attendanceData) {
                const data = attendanceData[subject];
                if (data.hadir > 0 || data.sakit > 0 || data.izin > 0 || data.tidakHadir > 0) {
                    hasAnyStatus = true;
                    summaryHtml += `<li class="text-lg text-gray-700"><strong>${subject}</strong>: <br>
                    - Hadir: ${data.hadir} kali <br>
                    - Sakit: ${data.sakit} kali <br>
                    - Izin: ${data.izin} kali <br>
                    - Tidak Hadir: ${data.tidakHadir} kali
                    </li>`;
                }
            }

            if (!hasAnyStatus) {
                summaryHtml += '<li class="text-lg text-gray-700 text-center">Tidak ada data kehadiran yang tercatat.</li>';
            }
            summaryHtml += '</ul>';
            summaryDiv.innerHTML = summaryHtml;
        }


        // Add event listeners to all checkboxes and select elements to save state on change
        document.addEventListener('DOMContentLoaded', () => {
            loadState(); // Load all saved state when the page loads
            updateAbsenceSummary(); // Initial summary update

            document.querySelectorAll('.attendance-select').forEach(select => {
                select.addEventListener('change', saveState);
            });

            document.querySelectorAll('.class-mode-select').forEach(select => {
                select.addEventListener('change', saveState);
            });

            // Reset button functionality
            document.getElementById('resetButton').addEventListener('click', () => {
                const confirmation = confirm("Apakah Anda yakin ingin mereset semua data kehadiran dan mode kelas?");
                if (confirmation) {
                    document.querySelectorAll('.attendance-select').forEach(select => {
                        select.value = "Hadir"; // Reset to default
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
                    // Skip the "KELAS MALAM SI 7" header row
                    if (row.querySelector('td[colspan="21"]')) {
                        return;
                    }

                    const cells = row.querySelectorAll('td');
                    let rowData = [];
                    // Extract fixed data (Day, Subject, Time, Lecturer, Room)
                    for (let i = 0; i < 5; i++) {
                        rowData.push('"' + cells[i].textContent.trim().replace(/"/g, '""') + '"');
                    }
                    // Extract Attendance and Class Mode for each meeting
                    const meetingCells = row.querySelectorAll('.meeting-cell');
                    meetingCells.forEach(meetingCell => {
                        const attendanceSelect = meetingCell.querySelector('.attendance-select');
                        const modeSelect = meetingCell.querySelector('.class-mode-select');
                        let attendanceStatus = attendanceSelect ? attendanceSelect.value : "";
                        let classMode = modeSelect ? modeSelect.value : "";
                        rowData.push('"' + attendanceStatus + '","' + classMode + '"');
                    });
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