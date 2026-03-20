document.addEventListener('DOMContentLoaded', () => {
    // Load players from the CSV file
    fetch('../dataWithCR_updated.csv')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n').slice(1); // Skip header row
            const playerTable = document.getElementById('playerTable').querySelector('tbody');

            let selectedPlayers = [];
            let totalEspnPaid = 0;

            rows.forEach(row => {
                if (row.trim()) {
                    const [player, projPtsTotal, projPtsAvg, position, posRank, , , , draftedValue] = row.split(',');
                    const tr = document.createElement('tr');

                    [player, projPtsTotal, projPtsAvg, position, posRank, draftedValue].forEach(value => {
                        const td = document.createElement('td');
                        td.textContent = value.trim();
                        tr.appendChild(td);
                    });

                    tr.addEventListener('click', () => addToSelectedList({
                        player,
                        projPtsAvg: parseFloat(projPtsAvg),
                        espnPaid: parseFloat(draftedValue),
                        position
                    }));
                    playerTable.appendChild(tr);
                }
            });

            function updateTotals() {
                // Calculate the optimal starting roster
                const roster = getOptimalStartingRoster(selectedPlayers);

                // Calculate totals for the starting roster
                const totalProjPtsAvg = roster.reduce((sum, player) => sum + player.projPtsAvg, 0);
                totalEspnPaid = selectedPlayers.reduce((sum, player) => sum + player.draftedValue, 0);

                document.getElementById('totalProjPtsAvg').textContent = `Total ProjPtsAvg: ${totalProjPtsAvg.toFixed(2)}`;
                document.getElementById('totalEspnPaid').textContent = `Total ESPN Paid: ${totalEspnPaid.toFixed(2)}`;
            }

            function addToSelectedList(player) {
                const selectedList = document.getElementById('selectedList');

                // Check if player is already selected
                if (selectedPlayers.some(p => p.player === player.player)) return;

                // Add player to selected list
                selectedPlayers.push(player);

                const li = document.createElement('li');
                li.textContent = player.player;
                li.addEventListener('click', () => {
                    const index = selectedPlayers.findIndex(p => p.player === player.player);
                    if (index > -1) {
                        selectedPlayers.splice(index, 1);
                        li.remove();
                        updateTotals();
                    }
                });

                selectedList.appendChild(li);
                updateTotals();
            }

            function getOptimalStartingRoster(players) {
                const positions = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2 };
                const roster = [];

                // Group players by position
                const positionGroups = players.reduce((acc, player) => {
                    if (!acc[player.position]) acc[player.position] = [];
                    acc[player.position].push(player);
                    return acc;
                }, {});

                // Sort players by projPtsAvg in descending order for each position
                for (const pos in positionGroups) {
                    positionGroups[pos].sort((a, b) => b.projPtsAvg - a.projPtsAvg);
                }

                // Fill required slots: QB, RB, WR, TE
                ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
                    const count = positions[pos] || 0;
                    if (positionGroups[pos]) {
                        roster.push(...positionGroups[pos].slice(0, count));
                    }
                });

                // Fill FLEX slots with remaining best RB/WR/TE
                const flexPool = ['RB', 'WR', 'TE']
                    .flatMap(pos => positionGroups[pos] || [])
                    .sort((a, b) => b.projPtsAvg - a.projPtsAvg);

                roster.push(...flexPool.slice(0, positions.FLEX));

                return roster;
            }

            // Add totals display
            const rightPanel = document.querySelector('.right-panel');
            const totalsDiv = document.createElement('div');
            totalsDiv.id = 'totals';
            totalsDiv.innerHTML = `
                <p id="totalProjPtsAvg">Total ProjPtsAvg: 0.00</p>
                <p id="totalEspnPaid">Total ESPN Paid: 0.00</p>
            `;
            rightPanel.appendChild(totalsDiv);
        })
        .catch(err => console.error('Error loading CSV:', err));
});
