document.addEventListener('DOMContentLoaded', () => {
    const contestListSection = document.getElementById('contest-list-section');
    const contestDetailSection = document.getElementById('contest-detail-section');
    const contestListContainer = document.getElementById('contest-list');
    const contestDetailContent = document.getElementById('contest-detail-content');
    const backToListButton = document.getElementById('back-to-list');
    const showAllContestsNav = document.getElementById('show-all-contests');
    const loadingMessage = document.getElementById('loading-message');
    const noContestsMessage = document.getElementById('no-contests-message');

    // !!! MUHIM: BU YERNI O'ZGARTIRISHINGIZ KERAK !!!
    // Sizning api.php faylingiz joylashgan URL manzilini kiriting.
    // Misol: 'https://yourdomain.com/your_bot_folder/api.php'
    // Yoki localhostda bo'lsa: 'http://localhost/your_bot_folder/api.php'
    const API_BASE_URL = 'https://c546.coresuz.ru/app/api.php';'; // <--- BU YERNI O'ZGARTIRING

    // Sahifa bo'limlarini ko'rsatish funksiyasi
    function showSection(sectionToShow) {
        contestListSection.classList.add('hidden-section');
        contestDetailSection.classList.add('hidden-section');

        if (sectionToShow === 'list') {
            contestListSection.classList.remove('hidden-section');
        } else if (sectionToShow === 'detail') {
            contestDetailSection.classList.remove('hidden-section');
        }
    }

    // Konkurslar ro'yxatini yuklash va ko'rsatish
    async function fetchContests() {
        loadingMessage.style.display = 'block';
        noContestsMessage.style.display = 'none';
        contestListContainer.innerHTML = ''; // Oldingi ma'lumotlarni tozalash

        try {
            const response = await fetch(`${API_BASE_URL}?action=get_all_contests`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            loadingMessage.style.display = 'none'; // Yuklash xabarini yashirish

            if (data.status === 'success' && Object.keys(data.data).length > 0) {
                // Ma'lumotlar obyektdan kelgani uchun Object.values() ni ishlatdik
                Object.values(data.data).forEach(contest => {
                    const card = document.createElement('div');
                    card.classList.add('contest-card');
                    card.innerHTML = `
                        <h3>${contest.name}</h3>
                        <p><strong>NFT:</strong> <a href="${contest.nft_link}" target="_blank">Ko'rish</a></p>
                        <p><strong>Ishtirokchilar:</strong> ${contest.participants.length}</p>
                        <p><strong>Holati:</strong> <span class="status ${contest.status}">${contest.status === 'active' ? 'Faol' : 'Yakunlangan'}</span></p>
                        <p><strong>Yakunlanadi:</strong> ${formatContestEndTime(contest)}</p>
                    `;
                    // contest.id ni to'g'ri raqam sifatida beramiz
                    card.addEventListener('click', () => showContestDetail(contest.id)); 
                    contestListContainer.appendChild(card);
                });
            } else {
                noContestsMessage.style.display = 'block'; // Konkurslar yo'q xabarini ko'rsatish
            }
        } catch (error) {
            console.error('Konkurslarni yuklashda xatolik:', error);
            loadingMessage.textContent = 'Konkurslarni yuklashda xatolik yuz berdi. Iltimos, API URLini tekshiring.';
            loadingMessage.style.color = 'red';
            loadingMessage.style.display = 'block';
        }
    }

    // Konkurs tafsilotlarini yuklash va ko'rsatish
    async function showContestDetail(contestId) {
        showSection('detail');
        contestDetailContent.innerHTML = '<p class="info-message">Tafsilotlar yuklanmoqda...</p>'; // Yuklash xabari

        try {
            const response = await fetch(`${API_BASE_URL}?action=get_contest_details&id=${contestId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.status === 'success') {
                const contest = data.data;
                
                // Majburiy obuna kanallarini shakllantirish
                let channelsHtml = contest.channels && contest.channels.length > 0
                    ? contest.channels.map(channel => `<a href="https://t.me/${channel}" target="_blank">@${channel}</a>`).join(', ')
                    : 'Mavjud emas';

                // G'olib ma'lumotini tekshirish
                let winnerInfo = '';
                if (contest.status === 'finished' && contest.winner_id) {
                    winnerInfo = `<p><strong>G'olib ID:</strong> ${contest.winner_id}</p>`;
                    // Agar winner_username ham bo'lsa, uni ham ko'rsatish
                    // if (contest.winner_username) {
                    //     winnerInfo += `<p><strong>G'olib User:</strong> <a href="https://t.me/${contest.winner_username}" target="_blank">@${contest.winner_username}</a></p>`;
                    // }
                }

                contestDetailContent.innerHTML = `
                    <h2>${contest.name}</h2>
                    <p><strong>Konkurs ID:</strong> #${contest.id}</p>
                    <p><strong>NFT ssilkasi:</strong> <a href="${contest.nft_link}" target="_blank">${contest.nft_link}</a></p>
                    <p><strong>Majburiy obuna kanallari:</strong> ${channelsHtml}</p>
                    <p><strong>Davomiyligi:</strong> ${contest.end_type === 'time' ? contest.duration_hours + ' soat' : contest.members_count + ' ishtirokchi'}</p>
                    <p><strong>Yuborilgan kanal:</strong> <a href="https://t.me/${contest.post_channel}" target="_blank">@${contest.post_channel}</a></p>
                    <p><strong>Ma'lumot:</strong> ${contest.description}</p>
                    <p><strong>Ishtirokchilar:</strong> ${contest.participants.length}</p>
                    <p><strong>Holati:</strong> <span class="status ${contest.status}">${contest.status === 'active' ? 'Faol' : 'Yakunlangan'}</span></p>
                    ${winnerInfo}
                    <p><strong>Qolgan vaqt:</strong> ${formatContestEndTime(contest)}</p>
                `;
            } else {
                contestDetailContent.innerHTML = `<p class="info-message" style="color: red;">Xatolik: ${data.message}</p>`;
            }
        } catch (error) {
            console.error('Konkurs tafsilotlarini yuklashda xatolik:', error);
            contestDetailContent.innerHTML = '<p class="info-message" style="color: red;">Tafsilotlarni yuklashda kutilmagan xatolik yuz berdi.</p>';
        }
    }

    // Konkurs tugash vaqtini formatlash
    function formatContestEndTime(contest) {
        if (contest.status === 'finished') {
            return "Yakunlangan";
        }

        if (contest.end_type === 'members') {
            return `Ishtirokchilar soni: ${contest.participants.length} / ${contest.members_count}`;
        } else if (contest.end_type === 'time') {
            const now = Math.floor(Date.now() / 1000); // Hozirgi Unix timestamp (sekundlarda)
            const remainingTime = contest.end_time - now;

            if (remainingTime <= 0) {
                return "Yakunlangan";
            }

            const days = Math.floor(remainingTime / (60 * 60 * 24));
            const hours = Math.floor((remainingTime % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
            const seconds = remainingTime % 60;

            let timeLeft = "";
            if (days > 0) timeLeft += `${days} kun `;
            if (hours > 0) timeLeft += `${hours} soat `;
            if (minutes > 0) timeLeft += `${minutes} daqiqa `;
            // Faqat qisqa vaqt qolganda soniyani ko'rsatish
            if (seconds > 0 && days === 0 && hours === 0 && minutes < 5) timeLeft += `${seconds} soniya `;
            else if (seconds > 0 && days === 0 && hours === 0 && minutes === 0) timeLeft += `${seconds} soniya `;
            
            return timeLeft.trim() + " qoldi";
        }
        return "Noma'lum";
    }

    // Event listeners
    backToListButton.addEventListener('click', () => {
        showSection('list');
        fetchContests(); // Ro'yxatga qaytganda yangilash
    });

    showAllContestsNav.addEventListener('click', (e) => {
        e.preventDefault(); // Sahifaning yuqorisiga o'tib ketmaslik uchun
        showSection('list');
        fetchContests(); // Navdan bosganda yangilash
    });

    // Sahifa yuklanganda konkurslarni yuklash
    fetchContests();
});
