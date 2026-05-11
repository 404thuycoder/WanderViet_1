const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

const newSuggestionsCode = `
    function getLocalizedGreeting() {
      const lang = localStorage.getItem('wander_chat_lang') || 'auto';
      if (lang === 'en') return 'Hello! I am ready for a new conversation. How can I help you with your trip?';
      if (lang === 'kr') return '안녕하세요! 새로운 대화를 시작할 준비가 되었습니다. 여행과 관련하여 무엇을 도와드릴까요?';
      if (lang === 'jp') return 'こんにちは！新しい会話の準備ができました。ご旅行について何かお手伝いできることはありますか？';
      if (lang === 'zh') return '你好！我已经准备好进行新的对话了。关于您的旅行，我能帮您什么忙吗？';
      if (lang === 'fr') return 'Bonjour ! Je suis prêt pour une nouvelle conversation. Comment puis-je vous aider avec votre voyage ?';
      return 'Chào bạn! Tôi đã sẵn sàng cho cuộc trò chuyện mới. Mình có thể giúp gì cho chuyến đi của bạn?';
    }

    function getDefaultSuggestions() {
      const lang = localStorage.getItem('wander_chat_lang') || 'auto';
      if (lang === 'en') return [
        { text: '🗺️ Plan Itinerary', query: 'Plan a travel itinerary for me' },
        { text: '🏨 Find Accommodation', query: 'Find a nice hotel or homestay' },
        { text: '🍽️ Local Food', query: 'Suggest some local specialties' },
        { text: '📸 Check-in Spots', query: 'Best spots for photography' }
      ];
      if (lang === 'kr') return [
        { text: '🗺️ 일정 계획', query: '여행 일정을 계획해 주세요' },
        { text: '🏨 숙소 찾기', query: '좋은 호텔이나 숙소를 찾아주세요' },
        { text: '🍽️ 로컬 맛집', query: '현지 특산물을 추천해 주세요' },
        { text: '📸 사진 명소', query: '사진 찍기 좋은 최고의 장소' }
      ];
      if (lang === 'jp') return [
        { text: '🗺️ 日程を作成', query: '旅行のスケジュールを作成してください' },
        { text: '🏨 宿泊先を探す', query: '素敵なホテルや民泊を見つけてください' },
        { text: '🍽️ 地元グルメ', query: '地元の名物料理を提案してください' },
        { text: '📸 撮影スポット', query: '写真撮影に最適なスポット' }
      ];
      if (lang === 'fr') return [
        { text: '🗺️ Planifier l\\'itinéraire', query: 'Planifiez un itinéraire de voyage pour moi' },
        { text: '🏨 Trouver un logement', query: 'Trouver un bel hôtel ou chez l\\'habitant' },
        { text: '🍽️ Spécialités locales', query: 'Suggérer des spécialités locales' },
        { text: '📸 Lieux de photos', query: 'Meilleurs endroits pour la photographie' }
      ];
      if (lang === 'zh') return [
        { text: '🗺️ 计划行程', query: '为我制定一个旅行行程' },
        { text: '🏨 寻找住宿', query: '找一家不错的酒店或民宿' },
        { text: '🍽️ 当地美食', query: '推荐一些当地特色美食' },
        { text: '📸 打卡地点', query: '最适合拍照的景点' }
      ];
      return [
        { text: '🗺️ Lập lịch trình', query: 'Lập lịch trình du lịch cho mình' },
        { text: '🏨 Tìm chỗ ở', query: 'Tìm khách sạn hoặc homestay đẹp' },
        { text: '🍽️ Món ngon', query: 'Gợi ý các món ăn đặc sản địa phương' },
        { text: '📸 Điểm check-in', query: 'Những địa điểm chụp ảnh đẹp nhất' }
      ];
    }
`;

// Replace DEFAULT_SUGGESTIONS const
content = content.replace(
  /const DEFAULT_SUGGESTIONS = \[\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\}\s*\];/,
  newSuggestionsCode
);

// Replace usages of DEFAULT_SUGGESTIONS
content = content.replace(/renderSuggestions\(DEFAULT_SUGGESTIONS\)/g, 'renderSuggestions(getDefaultSuggestions())');

// Replace the greeting string
const greetingStr = "'Chào bạn! Tôi đã sẵn sàng cho cuộc trò chuyện mới. Mình có thể giúp gì cho chuyến đi của bạn?'";
content = content.replace(new RegExp(greetingStr, 'g'), 'getLocalizedGreeting()');

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing localized suggestions and greetings.');
