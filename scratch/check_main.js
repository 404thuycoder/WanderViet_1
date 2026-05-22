    document.addEventListener('DOMContentLoaded', () => {
      const tripDate = document.getElementById('tripDate');
      if (tripDate && !tripDate.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        tripDate.value = `${yyyy}-${mm}-${dd}`;
      }

      // Kích hoạt render vùng đầu tiên ngay khi tải trang (legacy)
      const activeRegion = document.querySelector('.region-card.active') || document.querySelector('.region-card');
      if (activeRegion && typeof selectRegion === 'function') {
        selectRegion(activeRegion);
      }

      // Kích hoạt V2 wizard: render destination grid cho Miền Bắc mặc định
      setTimeout(() => {
        if (typeof renderDestinationsV2 === 'function') {
          renderDestinationsV2();
        }
        // Đảm bảo Step 1 active khi tải trang
        const step1 = document.getElementById('wizardSubStep1');
        if (step1) step1.classList.add('active');
        const hdr1 = document.getElementById('stepHeader1');
        if (hdr1) hdr1.classList.add('active');
      }, 100);
    });

    const REGION_DESTINATIONS = {
      'Miền Bắc': [
        { name: 'Hà Nội', img: 'https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=200&h=150&fit=crop', rating: '4.9', desc: 'Thủ đô nghìn năm văn hiến cổ kính, trái tim văn hóa lịch sử của cả nước.', spots: ['Hồ Hoàn Kiếm', 'Lăng Bác', 'Phố Cổ'] },
        { name: 'Hạ Long', img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=200&h=150&fit=crop', rating: '4.8', desc: 'Kỳ quan thiên nhiên thế giới với hàng nghìn đảo đá vôi độc đáo.', spots: ['Vịnh Hạ Long', 'Đảo Ti Tốp', 'Hang Sửng Sốt'] },
        { name: 'Sapa', img: 'https://images.unsplash.com/photo-1508809159021-4171206013a2?w=200&h=150&fit=crop', rating: '4.9', desc: 'Thị trấn trong sương với khí hậu mát mẻ quanh năm và ruộng bậc thang.', spots: ['Fansipan', 'Cát Cát', 'Đèo Ô Quy Hồ'] },
        { name: 'Ninh Bình', img: 'https://images.unsplash.com/photo-1599708153386-62e26066265e?w=200&h=150&fit=crop', rating: '4.8', desc: 'Cố đô Hoa Lư yên bình kết hợp phong cảnh non nước Tràng An tuyệt mỹ.', spots: ['Tràng An', 'Bái Đính', 'Hang Múa'] },
        { name: 'Hà Giang', img: 'https://images.unsplash.com/photo-1581691101914-df07ba063852?w=200&h=150&fit=crop', rating: '4.9', desc: 'Vùng cao nguyên đá hùng vĩ nơi biên cương với những khúc cua đèo uốn lượn.', spots: ['Mã Pí Lèng', 'Cột cờ Lũng Cú', 'Dốc Thẩm Mã'] },
        { name: 'Mộc Châu', img: 'https://images.unsplash.com/photo-1623863484089-9e8c4f03943d?w=200&h=150&fit=crop', rating: '4.7', desc: 'Cao nguyên xanh mướt nổi tiếng với đồi chè trái tim và thung lũng mận.', spots: ['Đồi chè Trái Tim', 'Thác Dải Yếm', 'Bản Áng'] },
        { name: 'Cao Bằng', img: 'https://images.unsplash.com/photo-1563812739347-1906a5996055?w=200&h=150&fit=crop', rating: '4.8', desc: 'Thác Bản Giốc hùng vĩ nhất Việt Nam cùng các hang động hoang sơ kỳ bí.', spots: ['Thác Bản Giốc', 'Động Ngườm Ngao', 'Pác Bó'] },
        { name: 'Mai Châu', img: 'https://images.unsplash.com/photo-1589146162335-c340b498425d?w=200&h=150&fit=crop', rating: '4.6', desc: 'Thung lũng thanh bình mang đậm bản sắc văn hóa của đồng bào dân tộc Thái.', spots: ['Đèo Đá Trắng', 'Bản Lác', 'Hang Chiều'] },
        { name: 'Tam Đảo', img: 'https://images.unsplash.com/photo-1594910403541-610116e09c85?w=200&h=150&fit=crop', rating: '4.6', desc: 'Được mệnh danh là Đà Lạt của miền Bắc với mây mù bao phủ quanh năm.', spots: ['Cổng Trời', 'Nhà thờ cổ', 'Cầu Mây'] },
        { name: 'Ba Vì', img: 'https://images.unsplash.com/photo-1616853215286-353d9154a1d8?w=200&h=150&fit=crop', rating: '4.5', desc: 'Khu rừng quốc gia mát mẻ xanh tươi thích hợp cắm trại cuối tuần dã ngoại.', spots: ['Vườn quốc gia', 'Nhà thờ đổ', 'Khoang Xanh'] },
        { name: 'Cát Bà', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=200&h=150&fit=crop', rating: '4.7', desc: 'Hòn đảo ngọc hoang sơ trên vịnh Lan Hạ thơ mộng kế bên Hải Phòng.', spots: ['Vịnh Lan Hạ', 'Đảo Khỉ', 'Pháo đài Thần công'] },
        { name: 'Yên Bái', img: 'https://images.unsplash.com/photo-1581177653526-70e28f309e3e?w=200&h=150&fit=crop', rating: '4.7', desc: 'Khám phá ruộng bậc thang Mù Cang Chải rực vàng mùa lúa chín.', spots: ['Mù Cang Chải', 'Hồ Thác Bà', 'Đèo Khau Phạ'] },
        { name: 'Điện Biên', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200&h=150&fit=crop', rating: '4.7', desc: 'Vùng đất lịch sử oai hùng của chiến dịch Điện Biên Phủ lừng lẫy năm châu.', spots: ['Đồi A1', 'Hầm Đờ Cát', 'Sở chỉ huy Mường Phăng'] },
        { name: 'Lạng Sơn', img: 'https://images.unsplash.com/photo-1587588354456-ae376af7182f?w=200&h=150&fit=crop', rating: '4.5', desc: 'Xứ Lạng giáp biên với núi Mẫu Sơn tuyết phủ và chợ sầm uất.', spots: ['Ải Chi Lăng', 'Mẫu Sơn', 'Chợ Đông Kinh'] },
        { name: 'Bắc Kạn', img: 'https://images.unsplash.com/photo-1596395817260-2440f3131759?w=200&h=150&fit=crop', rating: '4.6', desc: 'Hồ Ba Bể trong xanh tĩnh lặng nằm giữa lòng núi đá vôi hùng vĩ.', spots: ['Hồ Ba Bể', 'Động Puông', 'Thác Đầu Đẳng'] },
        { name: 'Tuyên Quang', img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=200&h=150&fit=crop', rating: '4.5', desc: 'Thủ đô kháng chiến mang tính lịch sử cùng hồ Na Hang xanh biếc thơ mộng.', spots: ['Khu di tích Tân Trào', 'Na Hang', 'Suối khoáng Mỹ Lâm'] },
        { name: 'Thái Nguyên', img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=200&h=150&fit=crop', rating: '4.5', desc: 'Thủ phủ chè xanh ngát hương, nơi có khu du lịch Hồ Núi Cốc nổi tiếng.', spots: ['Hồ Núi Cốc', 'Đồi chè Tân Cương', 'Hang Phượng Hoàng'] },
        { name: 'Bắc Ninh', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop', rating: '4.6', desc: 'Nôi văn hóa xứ Kinh Bắc nổi danh với các làn điệu Dân ca Quan họ mượt mà.', spots: ['Chùa Phật Tích', 'Đền Đô', 'Làng tranh Đông Hồ'] },
        { name: 'Bắc Giang', img: 'https://images.unsplash.com/photo-1581691101914-df07ba063852?w=200&h=150&fit=crop', rating: '4.5', desc: 'Vùng đất tâm linh Tây Yên Tử cùng vườn cây trái sum suê đặc sản.', spots: ['Tây Yên Tử', 'Chùa Vĩnh Nghiêm', 'Khu di tích Suối Mỡ'] },
        { name: 'Phú Thọ', img: 'https://images.unsplash.com/photo-1563812739347-1906a5996055?w=200&h=150&fit=crop', rating: '4.6', desc: 'Đất Tổ cội nguồn dân tộc Việt Nam với Đền Hùng linh thiêng.', spots: ['Đền Hùng', 'Đầm Ao Châu', 'Khu nước khoáng Thanh Thủy'] },
        { name: 'Lai Châu', img: 'https://images.unsplash.com/photo-1589146162335-c340b498425d?w=200&h=150&fit=crop', rating: '4.6', desc: 'Đỉnh đèo Ô Quy Hồ hoang dại và những bản làng nguyên sơ đầy sắc màu.', spots: ['Đỉnh đèo Ô Quy Hồ', 'Động Tiên Sơn', 'Bản Thẳm'] },
        { name: 'Hải Phòng', img: 'https://images.unsplash.com/photo-1594910403541-610116e09c85?w=200&h=150&fit=crop', rating: '4.7', desc: 'Thành phố Hoa phượng đỏ sầm uất với bến cảng và đảo Đồ Sơn lộng gió.', spots: ['Bãi biển Đồ Sơn', 'Hòn Dấu', 'Nhà hát lớn Hải Phòng'] },
        { name: 'Nam Định', img: 'https://images.unsplash.com/photo-1616853215286-353d9154a1d8?w=200&h=150&fit=crop', rating: '4.5', desc: 'Vùng đất giàu truyền thống khoa bảng và nhiều nhà thờ cổ kính mang nét Tây Âu.', spots: ['Nhà thờ đổ Hải Lý', 'Đền Trần Nam Định', 'Chùa Cổ Lễ'] },
        { name: 'Thái Bình', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=200&h=150&fit=crop', rating: '4.4', desc: 'Quê hương của lúa gạo sông Hồng cùng những bãi biển vô cực độc lạ gần đây.', spots: ['Biển vô cực Đồng Châu', 'Chùa Keo', 'Khu sinh thái Cồn Vành'] },
        { name: 'Hải Dương', img: 'https://images.unsplash.com/photo-1581177653526-70e28f309e3e?w=200&h=150&fit=crop', rating: '4.4', desc: 'Địa danh gắn liền với danh nhân Nguyễn Trãi và bánh đậu xanh ngọt mát.', spots: ['Côn Sơn Kiếp Bạc', 'Đảo Cò Chi Lăng Nam', 'Chùa Thanh Mai'] }
      ],
      'Miền Trung': [
        { name: 'Đà Nẵng', img: 'https://images.unsplash.com/photo-1559592443-7f87a030062a?w=200&h=150&fit=crop', rating: '4.9', desc: 'Thành phố đáng sống bậc nhất với Cầu Vàng lơ lửng và bờ biển dài thơ mộng.', spots: ['Cầu Vàng', 'Bà Nà Hills', 'Ngũ Hành Sơn'] },
        { name: 'Hội An', img: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=200&h=150&fit=crop', rating: '4.9', desc: 'Di sản thế giới yên bình lung linh ánh đèn lồng bên dòng sông Hoài hoài cổ.', spots: ['Chùa Cầu', 'Sông Hoài', 'Rừng dừa Cẩm Thanh'] },
        { name: 'Huế', img: 'https://images.unsplash.com/photo-1590054387835-ab72678fef01?w=200&h=150&fit=crop', rating: '4.8', desc: 'Cố đô trầm mặc cổ kính với lăng tẩm hoàng gia và dòng sông Hương hiền hòa.', spots: ['Đại Nội', 'Lăng Khải Định', 'Chùa Thiên Mụ'] },
        { name: 'Nha Trang', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200&h=150&fit=crop', rating: '4.9', desc: 'Vịnh biển xanh cát trắng nắng vàng rực rỡ với các trò chơi giải trí hiện đại.', spots: ['VinWonders', 'Tháp Bà Ponagar', 'Hòn Mun'] },
        { name: 'Đà Lạt', img: 'https://images.unsplash.com/photo-1600100398055-149d56a3151b?w=200&h=150&fit=crop', rating: '4.9', desc: 'Thành phố ngàn hoa ngập tràn lãng mạn lãng đãng sương khói quanh năm.', spots: ['Hồ Tuyền Lâm', 'Vườn hoa TP', 'Langbiang'] },
        { name: 'Quy Nhơn', img: 'https://images.unsplash.com/photo-1586542158380-49272304d9a5?w=200&h=150&fit=crop', rating: '4.8', desc: 'Vùng đất biển hoang sơ xinh đẹp nổi danh với Kỳ Co, Eo Gió mát lịm.', spots: ['Kỳ Co', 'Eo Gió', 'Tháp Bánh Ít'] },
        { name: 'Mũi Né', img: 'https://images.unsplash.com/photo-1584981772656-78711422700f?w=200&h=150&fit=crop', rating: '4.7', desc: 'Những đồi cát bay vàng rực như sa mạc nhỏ nằm sát cạnh bãi biển xanh ngắt.', spots: ['Đồi Cát Đỏ', 'Bàu Trắng', 'Suối Tiên'] },
        { name: 'Phong Nha', img: 'https://images.unsplash.com/photo-1584305886638-348e3e4e9663?w=200&h=150&fit=crop', rating: '4.9', desc: 'Vương quốc hang động thế giới ẩn chứa kỳ quan thạch nhũ độc nhất vô nhị.', spots: ['Động Phong Nha', 'Động Thiên Đường', 'Sông Chày'] },
        { name: 'Phú Yên', img: 'https://images.unsplash.com/photo-1587588354456-ae376af7182f?w=200&h=150&fit=crop', rating: '4.8', desc: 'Xứ sở hoa vàng trên cỏ xanh với thắng cảnh Gành Đá Đĩa kỳ quan thiên tạo.', spots: ['Gành Đá Đĩa', 'Bãi Xép', 'Mũi Điện'] },
        { name: 'Pleiku', img: 'https://images.unsplash.com/photo-1596395817260-2440f3131759?w=200&h=150&fit=crop', rating: '4.6', desc: 'Đôi mắt Pleiku Biển Hồ T\'Nơng sâu thẳm mát lịm giữa cao nguyên Gia Lai.', spots: ['Biển Hồ T\'Nơng', 'Chùa Minh Thành', 'Thủy điện Yaly'] },
        { name: 'Buôn Ma Thuột', img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=200&h=150&fit=crop', rating: '4.7', desc: 'Thủ phủ cà phê ngát hương, nơi lưu giữ bản sắc cồng chiêng Tây Nguyên.', spots: ['Bảo tàng Cà phê', 'Thác Dray Nur', 'Buôn Đôn'] },
        { name: 'Kon Tum', img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=200&h=150&fit=crop', rating: '4.6', desc: 'Vùng cao nguyên thơ mộng với Măng Đen được gọi là Đà Lạt thứ hai.', spots: ['Nhà thờ Gỗ', 'Cầu treo Kon Klor', 'Măng Đen'] },
        { name: 'Thanh Hóa', img: 'https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=200&h=150&fit=crop', rating: '4.6', desc: 'Bãi biển Sầm Sơn náo nhiệt cùng di sản Thành Nhà Hồ vững chãi kiên cố.', spots: ['Bãi biển Sầm Sơn', 'Thành Nhà Hồ', 'Pù Luông'] },
        { name: 'Nghệ An', img: 'https://images.unsplash.com/photo-1590054387835-ab72678fef01?w=200&h=150&fit=crop', rating: '4.6', desc: 'Quê hương của Bác Hồ kính yêu tại Làng Sen và bãi biển Cửa Lò rộng mở.', spots: ['Quê Bác Làng Sen', 'Bãi biển Cửa Lò', 'Đồi chè Thanh Chương'] },
        { name: 'Hà Tĩnh', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200&h=150&fit=crop', rating: '4.5', desc: 'Địa danh lịch sử Ngã ba Đồng Lộc oai hùng cùng hồ Kẻ Gỗ thơ mộng bình yên.', spots: ['Ngã ba Đồng Lộc', 'Hồ Kẻ Gỗ', 'Chùa Hương Tích'] },
        { name: 'Quảng Trị', img: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=200&h=150&fit=crop', rating: '4.5', desc: 'Mảnh đất lịch sử vĩ tuyến 17 chia cắt hai miền oai hùng của dân tộc.', spots: ['Thành cổ Quảng Trị', 'Địa đạo Vịnh Mốc', 'Cầu Hiền Lương'] },
        { name: 'Quảng Ngãi', img: 'https://images.unsplash.com/photo-1559592443-7f87a030062a?w=200&h=150&fit=crop', rating: '4.6', desc: 'Đảo ngọc Lý Sơn được kiến tạo từ trầm tích núi lửa hàng triệu năm độc đáo.', spots: ['Đảo Lý Sơn', 'Bãi biển Mỹ Khê', 'Khu chứng tích Sơn Mỹ'] },
        { name: 'Phan Rang', img: 'https://images.unsplash.com/photo-1584981772656-78711422700f?w=200&h=150&fit=crop', rating: '4.6', desc: 'Vùng đất đầy nắng và gió đặc trưng bởi tháp Chàm cổ và các vườn nho trĩu quả.', spots: ['Vịnh Vĩnh Hy', 'Tháp Po Klong Garai', 'Đồi cát Nam Cương'] },
        { name: 'Đồng Xoài', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200&h=150&fit=crop', rating: '4.4', desc: 'Địa bàn có những trảng cỏ trù phú xanh tươi tại Bù Lạch Bình Phước.', spots: ['Trảng cỏ Bù Lạch', 'Thác Đứng', 'Vườn quốc gia Bù Gia Mập'] }
      ],
      'Miền Nam': [
        { name: 'TP.HCM', img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=200&h=150&fit=crop', rating: '4.9', desc: 'Đô thị năng động và sầm uất bậc nhất đất nước với những ánh đèn hoa lệ.', spots: ['Nhà thờ Đức Bà', 'Dinh Độc Lập', 'Chợ Bến Thành'] },
        { name: 'Phú Quốc', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop', rating: '4.9', desc: 'Đảo ngọc thiên đường nhiệt đới với hoàng hôn rực sắc trên biển xanh.', spots: ['Bãi Sao', 'Grand World', 'Cáp treo Hòn Thơm'] },
        { name: 'Cần Thơ', img: 'https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=200&h=150&fit=crop', rating: '4.8', desc: 'Trái tim của miền Tây sông nước nổi bật với khu chợ nổi Cái Răng tấp nập.', spots: ['Chợ nổi Cái Răng', 'Bến Ninh Kiều', 'Thiền viện Trúc Lâm'] },
        { name: 'Vũng Tàu', img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&h=150&fit=crop', rating: '4.7', desc: 'Điểm trốn nóng biển xanh lý tưởng nằm rất gần Thành phố Hồ Chí Minh.', spots: ['Tượng Chúa Kito', 'Bãi Sau', 'Hải đăng Vũng Tàu'] },
        { name: 'Côn Đảo', img: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=200&h=150&fit=crop', rating: '4.9', desc: 'Vịnh biển hoang sơ trữ tình, nơi gắn liền lịch sử cách mạng hào hùng kiên cường.', spots: ['Nhà tù Côn Đảo', 'Bãi Đầm Trầu', 'Nghĩa trang Hàng Dương'] },
        { name: 'An Giang', img: 'https://images.unsplash.com/photo-1563812739347-1906a5996055?w=200&h=150&fit=crop', rating: '4.7', desc: 'Vẻ đẹp sông nước yên ả ở rừng tràm Trà Sư và dãy Thất Sơn huyền bí.', spots: ['Rừng tràm Trà Sư', 'Miếu Bà Chúa Xứ', 'Núi Cấm'] },
        { name: 'Tây Ninh', img: 'https://images.unsplash.com/photo-1596395817260-2440f3131759?w=200&h=150&fit=crop', rating: '4.7', desc: 'Vùng đất thánh linh thiêng nơi có ngọn núi Bà Đen cao nhất Đông Nam Bộ.', spots: ['Núi Bà Đen', 'Tòa thánh Tây Ninh', 'Hồ Dầu Tiếng'] },
        { name: 'Bến Tre', img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=200&h=150&fit=crop', rating: '4.6', desc: 'Quê hương của những rặng dừa xanh mướt trải dài và các khu du lịch sinh thái.', spots: ['Cồn Phụng', 'Khu du lịch Lan Vương', 'Sân chim Vàm Hồ'] },
        { name: 'Đồng Tháp', img: 'https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=200&h=150&fit=crop', rating: '4.7', desc: 'Thủ phủ đất sen hồng mộc mạc cùng vườn cò Tràm Chim hoang dã trù phú.', spots: ['Vườn quốc gia Tràm Chim', 'Làng hoa Sa Đéc', 'Xẻo Quýt'] },
        { name: 'Cà Mau', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=200&h=150&fit=crop', rating: '4.7', desc: 'Nơi cực Nam Tổ quốc dạt dào sóng nước phù sa bồi đắp hàng năm.', spots: ['Cột mốc tọa độ', 'Đất Mũi', 'Lâm viên Cà Mau'] },
        { name: 'Bạc Liêu', img: 'https://images.unsplash.com/photo-1587588354456-ae376af7182f?w=200&h=150&fit=crop', rating: '4.6', desc: 'Nổi tiếng với giai thoại Công tử Bạc Liêu hào hoa và cánh đồng điện gió biển khơi.', spots: ['Nhà Công tử Bạc Liêu', 'Cánh đồng Điện gió', 'Chùa Xiêm Cán'] },
        { name: 'Sóc Trăng', img: 'https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=200&h=150&fit=crop', rating: '4.6', desc: 'Văn hóa giao thoa Kinh - Khmer - Hoa đặc sắc thông qua các ngôi chùa lộng lẫy.', spots: ['Chùa Dơi', 'Chùa Đất Sét', 'Chùa Chén Kiểu'] },
        { name: 'Trà Vinh', img: 'https://images.unsplash.com/photo-1590054387835-ab72678fef01?w=200&h=150&fit=crop', rating: '4.5', desc: 'Thành phố cây cổ thụ xanh mát cùng những ngôi chùa Khmer kiến trúc cổ kính.', spots: ['Ao Bà Om', 'Chùa Hang', 'Biển Ba Động'] },
        { name: 'Hậu Giang', img: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=200&h=150&fit=crop', rating: '4.5', desc: 'Đậm chất miền Tây Nam Bộ qua những khu rừng tràm ngập nước nguyên sinh.', spots: ['Chợ nổi Ngã Bảy', 'Khu bảo tồn Lung Ngọc Hoàng'] },
        { name: 'Vĩnh Long', img: 'https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=200&h=150&fit=crop', rating: '4.6', desc: 'Vùng cây trái trĩu quả xum xuê quanh năm nằm nép bên sông Tiền sông Hậu.', spots: ['Chùa Phật Ngọc Xá Lợi', 'Cù lao An Bình', 'Lò gạch Mang Thít'] },
        { name: 'Tiền Giang', img: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a594?w=200&h=150&fit=crop', rating: '4.6', desc: 'Vườn cây sum suê xum xuê trĩu quả cùng ngôi chùa cổ Vĩnh Tràng bề thế.', spots: ['Chùa Vĩnh Tràng', 'Chợ nổi Cái Bè', 'Cù lao Thới Sơn'] },
        { name: 'Đồng Nai', img: 'https://images.unsplash.com/photo-1544735724-449ad2bdd335?w=200&h=150&fit=crop', rating: '4.6', desc: 'Thác đá ba tầng hùng vĩ tại vườn quốc gia Nam Cát Tiên hoang sơ mát dịu.', spots: ['Vườn quốc gia Cát Tiên', 'Khu du lịch Bửu Long', 'Thác Giang Điền'] },
        { name: 'Bình Dương', img: 'https://images.unsplash.com/photo-1563812739347-1906a5996055?w=200&h=150&fit=crop', rating: '4.5', desc: 'Địa bàn tâm linh cổ kính chùa Bà Thiên Hậu cùng các làng gốm sứ truyền thống.', spots: ['Chùa Bà Thiên Hậu', 'Làng gốm Lái Thiêu', 'Đại Nam Văn Hiến'] },
        { name: 'Long An', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop', rating: '4.5', desc: 'Vùng đất đón nắng gió Đồng Tháp Mười hữu tình thơ mộng sát kề Sài Gòn.', spots: ['Làng nổi Tân Lập', 'Nhà cổ trăm cột', 'Khu sinh thái Cát Tường Phú Sinh'] }
      ]
    };

    let currentRegion = '';
    let currentDestIndex = 0;
    const SHOW_COUNT = 5;

    // Region card selection handler
    function selectRegion(card) {
      document.querySelectorAll('.region-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentRegion = card.dataset.region;
      currentDestIndex = 0;

      // Ẩn panel các điểm cụ thể và xóa lựa chọn cũ
      const attContainer = document.getElementById('cityAttractionsContainer');
      if (attContainer) {
        attContainer.style.display = 'none';
      }
      window.selectedAttractions = [];
      const extraInput = document.getElementById('additionalInfo');
      if (extraInput) {
        extraInput.value = extraInput.value.replace(/Ưu tiên đi qua các địa điểm du lịch: [^.]+\./g, '').trim();
      }

      renderDestinations();

      const panel = document.getElementById('regionDestinations');
      if (panel) {
        panel.style.display = 'block';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-8px)';
        requestAnimationFrame(() => {
          panel.style.transition = 'all 0.25s ease';
          panel.style.opacity = '1';
          panel.style.transform = 'translateY(0)';
        });
      }

      // Cập nhật placeholder
      const dest = document.getElementById('dest');
      if (dest && !dest.value) {
        const hints = {
          'Miền Bắc': 'VD: Hà Nội, Hạ Long, Sapa...',
          'Miền Trung': 'VD: Đà Nẵng, Hội An, Huế...',
          'Miền Nam': 'VD: TP.HCM, Phú Quốc, Cần Thơ...'
        };
        dest.placeholder = hints[currentRegion] || 'VD: Đà Lạt, Phú Quốc...';
      }
    }

    function renderDestinations() {
      const scrollContainer = document.getElementById('regionDestCards');
      const label = document.getElementById('regionDestLabel');
      
      if (label) label.textContent = currentRegion;
      if (!scrollContainer) return;
      scrollContainer.innerHTML = '';

      const allDest = REGION_DESTINATIONS[currentRegion] || [];
      // Hiện thị toàn bộ để vuốt
      allDest.forEach(dest => {
        const card = document.createElement('div');
        card.className = 'region-dest-card';
        // HTML hiển thị thêm các địa điểm du lịch bên trong
        const spotsHtml = dest.spots && dest.spots.length > 0 
          ? `<span class="dest-card-spots" style="display:block; font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${dest.spots.join(', ')}">📍 ${dest.spots.slice(0, 2).join(', ')}...</span>`
          : `<span class="dest-card-spots" style="display:block; font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">📍 Điểm đến nổi tiếng</span>`;

        card.innerHTML = `
          <div class="dest-card-image">
            <img src="${typeof window.getVNPhoto === 'function' ? window.getVNPhoto(dest.name, Math.floor(Math.random()*100)) : dest.img}" alt="${dest.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop';">
            <div class="dest-card-overlay">
              <span class="dest-add-icon">+</span>
            </div>
          </div>
          <div class="dest-card-info" style="padding: 0.6rem 0.75rem;">
            <span class="dest-card-name" style="font-weight:700; font-size:0.85rem;">${dest.name}</span>
            ${spotsHtml}
          </div>
        `;
        card.onclick = () => selectDestination(dest.name, card);
        scrollContainer.appendChild(card);
      });
    }

    function refreshDestinations() {
      // Đổi sang chế độ ngẫu nhiên thứ tự (shuffle)
      const allDest = REGION_DESTINATIONS[currentRegion] || [];
      allDest.sort(() => Math.random() - 0.5);
      
      const scrollContainer = document.getElementById('regionDestCards');
      if (scrollContainer) {
        scrollContainer.style.opacity = '0';
        setTimeout(() => {
          renderDestinations();
          scrollContainer.scrollLeft = 0; // Về đầu
          scrollContainer.style.transition = 'all 0.3s ease';
          scrollContainer.style.opacity = '1';
        }, 200);
      }
    }

    // Chọn điểm cụ thể → điền vào ô input và hiển thị địa điểm chi tiết bên trong
    window.selectedAttractions = [];

    function toggleAttractionChoice(name, element) {
      const idx = window.selectedAttractions.indexOf(name);
      if (idx > -1) {
        window.selectedAttractions.splice(idx, 1);
        element.style.background = 'rgba(255,255,255,0.03)';
        element.style.borderColor = 'var(--border)';
        element.style.color = 'var(--text)';
        const star = element.querySelector('.chip-star');
        if (star) star.style.color = '#00e5ff';
      } else {
        window.selectedAttractions.push(name);
        element.style.background = 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(59, 130, 246, 0.25))';
        element.style.borderColor = '#00e5ff';
        element.style.color = '#fff';
        const star = element.querySelector('.chip-star');
        if (star) star.style.color = '#fff';
      }

      updateAdditionalInfoWithAttractions();
    }

    function updateAdditionalInfoWithAttractions() {
      const extraInput = document.getElementById('additionalInfo');
      if (!extraInput) return;
      
      if (window.selectedAttractions.length > 0) {
        const attractionsText = `Ưu tiên đi qua các địa điểm du lịch: ${window.selectedAttractions.join(', ')}.`;
        let currentText = extraInput.value;
        currentText = currentText.replace(/Ưu tiên đi qua các địa điểm du lịch: [^.]+\./g, '').trim();
        extraInput.value = (currentText ? currentText + ' ' : '') + attractionsText;
      } else {
        extraInput.value = extraInput.value.replace(/Ưu tiên đi qua các địa điểm du lịch: [^.]+\./g, '').trim();
      }
    }

    function showCityAttractions(cityName) {
      const container = document.getElementById('cityAttractionsContainer');
      const listContainer = document.getElementById('cityAttractionsList');
      const label = document.getElementById('attractionCityName');
      if (!container || !listContainer || !label) return;

      window.selectedAttractions = [];
      const extraInput = document.getElementById('additionalInfo');
      if (extraInput) {
        extraInput.value = extraInput.value.replace(/Ưu tiên đi qua các địa điểm du lịch: [^.]+\./g, '').trim();
      }

      label.textContent = cityName;
      listContainer.innerHTML = '';

      let spots = [];
      const nameLower = cityName.toLowerCase().trim();
      const placeData = (window.WANDER_PLACES || []).find(p => 
        p.name.toLowerCase().trim() === nameLower ||
        nameLower.includes(p.name.toLowerCase().trim()) ||
        p.name.toLowerCase().trim().includes(nameLower)
      );

      if (placeData) {
        if (placeData.amusementPlaces && placeData.amusementPlaces.length > 0) {
          spots.push(...placeData.amusementPlaces.map(x => ({ name: x.name, type: 'Vui chơi' })));
        }
        if (placeData.checkInSpots && placeData.checkInSpots.length > 0) {
          spots.push(...placeData.checkInSpots.map(x => ({ name: x.name, type: 'Check-in' })));
        }
        if (placeData.diningPlaces && placeData.diningPlaces.length > 0) {
          spots.push(...placeData.diningPlaces.map(x => ({ name: x.name, type: 'Ẩm thực' })));
        }
      }

      if (spots.length === 0) {
        const destObj = (REGION_DESTINATIONS[currentRegion] || []).find(d => d.name === cityName);
        if (destObj && destObj.spots) {
          spots = destObj.spots.map(s => ({ name: s, type: 'Nổi bật' }));
        }
      }

      if (spots.length > 0) {
        container.style.display = 'block';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-5px)';
        requestAnimationFrame(() => {
          container.style.transition = 'all 0.3s ease';
          container.style.opacity = '1';
          container.style.transform = 'translateY(0)';
        });

        spots.forEach(spot => {
          const chip = document.createElement('div');
          chip.className = 'attraction-chip';
          chip.innerHTML = `
            <span class="chip-star" style="color:#00e5ff; font-size:0.75rem; transition:color 0.2s;">★</span>
            <span style="font-weight:600;">${spot.name}</span>
            <span style="font-size:0.6rem; opacity:0.8; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; font-weight:500; margin-left:0.25rem;">${spot.type}</span>
          `;
          
          chip.style.cssText = `
            display:inline-flex; align-items:center; gap:0.4rem; padding:0.45rem 0.9rem;
            background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:2rem;
            font-size:0.75rem; color:var(--text); cursor:pointer; transition:all 0.2s; user-select:none;
          `;

          chip.onclick = () => toggleAttractionChoice(spot.name, chip);
          listContainer.appendChild(chip);
        });
      } else {
        container.style.display = 'none';
      }
    }

    function selectDestination(name, cardEl) {
      document.querySelectorAll('.region-dest-card').forEach(c => c.classList.remove('active'));
      cardEl.classList.add('active');
      const dest = document.getElementById('dest');
      if (dest) {
        dest.value = name;
        dest.focus();
        const resultPlaceholder = document.querySelector('.planner-result-placeholder p');
        if (resultPlaceholder) {
          resultPlaceholder.innerHTML = `Đang chờ bạn hoàn tất thông tin cho chuyến đi <b>${name}</b>... ✨`;
        }
        dest.style.borderColor = '#3b82f6';
        dest.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
        setTimeout(() => { dest.style.borderColor = ''; dest.style.boxShadow = ''; }, 1500);
        showCityAttractions(name);
      }
    }

    // ===== V2 WIZARD LOGIC =====
    let currentWizardStep = 1;
    let selectedRegion = 'Miền Bắc';
    let selectedDestination = '';

    window.goToWizardStep = function(stepNum) {
      if (stepNum === 2) {
        const destVal = (document.getElementById('dest') || {}).value || '';
        if (!destVal.trim()) {
          alert('Vui lòng chọn ít nhất một điểm đến!');
          return;
        }
        const lbl = document.getElementById('v2ConfirmDestLabel');
        if (lbl) lbl.textContent = destVal.trim();
      }
      currentWizardStep = stepNum;
      document.querySelectorAll('.wizard-sub-step').forEach(s => s.classList.remove('active'));
      const tgt = document.getElementById('wizardSubStep' + stepNum);
      if (tgt) tgt.classList.add('active');
      document.querySelectorAll('.stepper-step').forEach(s => s.classList.remove('active'));
      const hdr = document.getElementById('stepHeader' + stepNum);
      if (hdr) hdr.classList.add('active');
      const card = document.getElementById('plannerFormCard');
      if (card) card.scrollIntoView({ behavior: 'smooth' });
    };

    window.selectRegionV2 = function(regionName) {
      selectedRegion = regionName;
      document.querySelectorAll('.region-hero-card').forEach(c => c.classList.remove('active'));
      const idMap = { 'Miền Bắc': 'heroRegionMB', 'Miền Trung': 'heroRegionMT', 'Miền Nam': 'heroRegionMN' };
      const sel = document.getElementById(idMap[regionName] || 'heroRegionMB');
      if (sel) sel.classList.add('active');
      const lbl = document.getElementById('v2SelectedRegionLabel');
      if (lbl) lbl.textContent = regionName;
      renderDestinationsV2();
    };

    window.renderDestinationsV2 = function() {
      const grid = document.getElementById('v2DestCardsGrid');
      if (!grid) return;
      grid.innerHTML = '';
      const dests = REGION_DESTINATIONS[selectedRegion] || [];
      dests.forEach((dest, i) => {
        const rating = dest.rating || '4.8';
        const card = document.createElement('div');
        card.className = 'v2-dest-card' + (selectedDestination === dest.name ? ' active' : '');
        const photoUrl = (typeof window.getVNPhoto === 'function')
          ? window.getVNPhoto(dest.name, i)
          : dest.img;
        card.innerHTML = `
          <div class="v2-dest-image" style="background-image:url('${photoUrl}')">
            <div class="v2-dest-badge-star">⭐ ${rating}</div>
            <div class="v2-dest-checked-indicator">✓</div>
          </div>
          <div class="v2-dest-info">
            <h4>${dest.name}</h4>
            <p>${dest.spots ? dest.spots.slice(0,3).join(', ') : 'Điểm đến hấp dẫn'}</p>
          </div>`;
        card.onclick = () => {
          showDestReviewPanel(dest, photoUrl, card);
        };
        grid.appendChild(card);
      });
    };

    // Helper for destination detailed metadata lookup
    window.getDestinationExtraDetails = function(name) {
      // Smart fallback generator using province name
      const rand = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(1));
      const defaultDetails = {
        bestTime: 'Quanh năm (Đẹp nhất vào mùa khô ráo)',
        gourmet: ['Đặc sản địa phương', 'Ẩm thực đường phố'],
        highlights: ['Khám phá thiên nhiên phong phú', 'Tìm hiểu văn hóa lịch sử bản địa', 'Trải nghiệm vui chơi, giải trí năng động'],
        scores: { scenery: 9.0, food: 8.8, cost: 8.5 },
        foodOptions: [
          { name: `Đặc sản truyền thống ${name}`, rating: rand(4.4,4.8), icon: '🍲' },
          { name: 'Nhà hàng đặc sản nổi tiếng địa phương', rating: rand(4.3,4.7), icon: '🍤' },
          { name: `Ăn vặt đường phố & Chợ đêm ${name}`, rating: rand(4.3,4.6), icon: '🍢' },
          { name: 'Cà phê rang xay & Đặc sản nước uống', rating: rand(4.4,4.7), icon: '☕' },
          { name: 'Hải sản tươi sống / Thịt nướng đặc trưng', rating: rand(4.2,4.6), icon: '🔥' }
        ],
        activityOptions: [
          { name: `Khám phá & Check-in danh lam ${name}`, rating: rand(4.5,4.8), icon: '📸' },
          { name: 'Tham quan di tích lịch sử - văn hóa địa phương', rating: rand(4.4,4.7), icon: '🏛️' },
          { name: 'Trải nghiệm thiên nhiên & Du lịch sinh thái', rating: rand(4.4,4.8), icon: '🏞️' },
          { name: 'Khám phá chợ địa phương & Mua quà lưu niệm', rating: rand(4.2,4.5), icon: '🛍️' },
          { name: 'Nghỉ dưỡng khách sạn / Homestay bản địa', rating: rand(4.4,4.7), icon: '🏨' }
        ]
      };
      
      const detailsMap = {
        'Hà Nội': {
          bestTime: '🍂 Tháng 8 - Tháng 11 (Mùa thu lãng mạn, mát mẻ)',
          gourmet: ['🍜 Phở Hà Nội', '🍖 Bún chả', '🥚 Cà phê trứng', '🌾 Cốm làng Vòng'],
          highlights: ['Dạo bước 36 phố phường cổ kính ngàn năm văn hiến', 'Ngắm hoàng hôn lãng mạn tại Hồ Tây lộng gió', 'Thưởng thức ẩm thực đường phố độc bản đêm Hà Nội'],
          scores: { scenery: 9.5, food: 9.8, cost: 9.0 }
        },
        'Hạ Long': {
          bestTime: '☀️ Tháng 4 - Tháng 6 (Thời tiết nắng ấm, trời trong xanh)',
          gourmet: ['🧆 Chả mực giã tay', '🐚 Sá sùng khô', '🥞 Bánh cuốn chả mực'],
          highlights: ['Du ngoạn kỳ quan thiên nhiên thế giới bằng du thuyền sang trọng', 'Chèo thuyền kayak khám phá Hang Luồn kỳ thú', 'Vui chơi sảng khoái tại công viên giải trí Sun World'],
          scores: { scenery: 9.9, food: 8.8, cost: 7.5 }
        },
        'Sapa': {
          bestTime: '🌾 Tháng 9 - Tháng 11 (Mùa lúa chín vàng óng ruộng bậc thang)',
          gourmet: ['🍲 Lẩu cá hồi cá tầm', '🍢 Thịt nướng đá', '🌽 Rượu ngô Bản Phố'],
          highlights: ['Chinh phục đỉnh Fansipan - Nóc nhà Đông Dương hùng vĩ', 'Trekking qua bản Cát Cát của người đồng bào H\'Mông', 'Săn biển mây bồng bềnh trên đỉnh đèo Ô Quy Hồ'],
          scores: { scenery: 9.8, food: 8.5, cost: 8.0 }
        },
        'Ninh Bình': {
          bestTime: '🌸 Tháng 1 - Tháng 3 (Mùa xuân mát mẻ, mùa lễ hội du xuân)',
          gourmet: ['🍘 Cơm cháy chà bông', '🐐 Thịt dê núi đá', '🍲 Ốc núi luộc sả'],
          highlights: ['Đi thuyền nan luồn qua các hang động kỳ ảo tại Tràng An', 'Chinh phục 500 bậc đá ngắm toàn cảnh Tam Cốc từ Hang Múa', 'Vãn cảnh ngôi chùa lớn kỷ lục Đông Nam Á - Bái Đính'],
          scores: { scenery: 9.7, food: 9.0, cost: 8.8 }
        },
        'Hà Giang': {
          bestTime: '🌸 Tháng 10 - Tháng 12 (Mùa hoa Tam Giác Mạch nở hồng sườn đồi)',
          gourmet: ['🍲 Cháo ấu tẩu', '🥘 Thắng cố Đồng Văn', '🥓 Lạp sườn gác bếp'],
          highlights: ['Chinh phục Mã Pí Lèng - một trong Tứ đại đỉnh đèo hùng vĩ nhất', 'Đi thuyền trên sông Nho Quế màu xanh ngọc bích qua hẻm Tu Sản', 'Đón gió biên cương cực Bắc Tổ quốc tại cột cờ Lũng Cú'],
          scores: { scenery: 9.9, food: 8.0, cost: 8.5 }
        },
        'Đà Nẵng': {
          bestTime: '☀️ Tháng 2 - Tháng 8 (Trời khô ráo, nắng vàng lý tưởng tắm biển)',
          gourmet: ['🍲 Mì Quảng ếch', '🥓 Bánh tráng cuốn thịt heo', '🐟 Gỏi cá Nam Ô'],
          highlights: ['Check-in Cầu Vàng nổi tiếng nâng bởi đôi bàn tay khổng lồ', 'Xem Cầu Rồng phun lửa phun nước sống động vào tối cuối tuần', 'Thư giãn tắm biển trên bãi biển Mỹ Khê - top hành tinh'],
          scores: { scenery: 9.6, food: 9.5, cost: 8.8 }
        },
        'Hội An': {
          bestTime: '🕯️ Tháng 2 - Tháng 4 (Thời tiết mát dịu, ít mưa, mát mẻ)',
          gourmet: ['🍜 Cao lầu Hội An', '🐔 Cơm gà Phố Hội', '🥖 Bánh mì Phượng'],
          highlights: ['Thả hoa đăng cầu may lung linh trên dòng sông Hoài thơ mộng', 'Khám phá các hội quán cổ kính và kiến trúc giao thoa độc đáo', 'Đi thuyền thúng len lỏi trong rừng dừa nước Cẩm Thanh sinh động'],
          scores: { scenery: 9.5, food: 9.7, cost: 9.0 }
        },
        'Huế': {
          bestTime: '👑 Tháng 1 - Tháng 4 (Mùa xuân dịu mát, ngập tràn sắc hoa)',
          gourmet: ['🍲 Bún bò Huế gốc', '🍛 Cơm hến vĩ dạ', '🍮 Bánh bột lọc, chè hẻm'],
          highlights: ['Khám phá lịch sử hoàng triều tại Đại Nội Huế cổ kính', 'Thưởng thức nhã nhạc cung đình tôn nghiêm trên thuyền rồng sông Hương', 'Chụp hình cực thơ tại lăng tẩm hoàng gia Khải Định, Tự Đức'],
          scores: { scenery: 9.2, food: 9.8, cost: 9.2 }
        },
        'Đà Lạt': {
          bestTime: '🍓 Tháng 11 - Tháng 3 (Khí hậu se lạnh sương mù thơ mộng)',
          gourmet: ['🍲 Lẩu gà lá é', '🥘 Bánh căn lòng gà', '🍕 Bánh tráng nướng'],
          highlights: ['Săn mây ngắm bình minh trên đồi chè Cầu Đất bát ngát', 'Dạo hồ Xuân Hương mát rượi và check-in quảng trường Lâm Viên', 'Cảm nhận nhịp sống chậm rãi tại các quán cà phê ngập tràn hoa lá'],
          scores: { scenery: 9.7, food: 9.2, cost: 8.5 }
        },
        'TP.HCM': {
          bestTime: '🌃 Tháng 12 - Tháng 4 (Mùa khô ráo, cuộc sống đêm náo nhiệt)',
          gourmet: ['🍛 Cơm tấm sườn chả', '🍜 Hủ tiếu Nam Vang', '🥖 Bánh mì Sài Gòn'],
          highlights: ['Ngắm toàn cảnh đô thị hoa lệ từ Landmark 81 đỉnh cao', 'Dạo bước trải nghiệm phố đi bộ Nguyễn Huệ, Bùi Viện sầm uất', 'Nghe nhạc sóng sôi động tại các quán bar sân thượng thời thượng'],
          scores: { scenery: 8.8, food: 9.9, cost: 8.5 }
        },
        'Phú Quốc': {
          bestTime: '🏝️ Tháng 11 - Tháng 4 (Mùa biển êm phẳng lặng, nước trong vắt)',
          gourmet: ['🐟 Gỏi cá trích', '🍜 Bún quậy Kiến Xây', '🐚 Còi biên mai'],
          highlights: ['Thư giãn trên bãi biển cát trắng tinh như kem tại Bãi Sao', 'Chiêm ngưỡng hoàng hôn rực sắc cam tím cực phẩm tại Sunset Sanato', 'Chơi thả ga tại VinWonders và Safari bán hoang dã lớn nhất'],
          scores: { scenery: 9.8, food: 9.2, cost: 7.5 }
        },
        'Vũng Tàu': {
          bestTime: '🌊 Quanh năm (Thích hợp cho chuyến đi ngắn cuối tuần nhanh)',
          gourmet: ['🥞 Bánh khọt Cô Ba', '🍲 Lẩu cá đuối', '🐚 Hải sản bến đá'],
          highlights: ['Chinh phục tượng Chúa Kito giang tay ngắm toàn cảnh biển khơi', 'Đón hoàng hôn lãng mạn bên ly cà phê view biển Bãi Trước', 'Hòa mình vào làn nước mát rượi tại Bãi Sau sóng vỗ rộn ràng'],
          scores: { scenery: 9.0, food: 9.3, cost: 8.8 }
        }
      };

      // Specific food & activity options for major destinations
      const FOOD_ACTIVITY_MAP = {
        'Hà Nội': {
          foodOptions: [
            { name: 'Phở gia truyền Bát Đàn (Hoàn Kiếm)', rating: 4.9, icon: '🍜' },
            { name: 'Bún chả Đắc Kim - Hàng Mành', rating: 4.8, icon: '🍖' },
            { name: 'Cà phê trứng Giảng - Hàng Gai', rating: 4.9, icon: '☕' },
            { name: 'Chả cá Lã Vọng - Chả Cá phố', rating: 4.7, icon: '🐟' },
            { name: 'Bún đậu mắm tôm Cô Lan - Hàng Khay', rating: 4.7, icon: '🌿' },
            { name: 'Bánh cuốn Bà Hoành - Tô Hiến Thành', rating: 4.6, icon: '🥢' }
          ],
          activityOptions: [
            { name: 'Dạo bộ Hồ Gươm & Phố đi bộ Đinh Tiên Hoàng', rating: 4.9, icon: '🚶' },
            { name: 'Xem Múa rối nước Nhà hát Thăng Long', rating: 4.8, icon: '🎭' },
            { name: 'Tham quan Văn Miếu - Quốc Tử Giám', rating: 4.8, icon: '🏛️' },
            { name: 'Tour đêm Nhà tù Hỏa Lò độc đáo', rating: 4.7, icon: '🕯️' },
            { name: 'Khám phá chợ đêm Đồng Xuân - Hàng Đào', rating: 4.5, icon: '🛍️' },
            { name: 'Check-in cầu Long Biên hoàng hôn', rating: 4.6, icon: '📸' }
          ]
        },
        'Hạ Long': {
          foodOptions: [
            { name: 'Chả mực giã tay Hạ Long chính gốc', rating: 4.8, icon: '🦑' },
            { name: 'Hải sản tươi sống bến Đoan - Bãi Cháy', rating: 4.8, icon: '🦞' },
            { name: 'Bánh cuốn chả mực bà Ngân', rating: 4.7, icon: '🥟' },
            { name: 'Sam biển nướng muối ớt Quảng Yên', rating: 4.6, icon: '🦀' },
            { name: 'Sá sùng rang muối đặc sản vùng biển', rating: 4.5, icon: '🌊' }
          ],
          activityOptions: [
            { name: 'Du thuyền ngủ đêm trên Vịnh Hạ Long', rating: 4.9, icon: '🛥️' },
            { name: 'Chèo Kayak qua Hang Luồn - Hang Sáng Tối', rating: 4.8, icon: '🚣' },
            { name: 'Cáp treo Nữ Hoàng Sun World Hạ Long', rating: 4.7, icon: '🎢' },
            { name: 'Leo núi Bài Thơ ngắm toàn cảnh vịnh', rating: 4.6, icon: '🧗' },
            { name: 'Thăm làng chài Cửa Vạn nổi trên biển', rating: 4.7, icon: '⛵' }
          ]
        },
        'Sapa': {
          foodOptions: [
            { name: 'Lẩu cá hồi cá tầm nhà hàng A Phủ', rating: 4.8, icon: '🐟' },
            { name: 'Thịt trâu gác bếp hun khói Sapa', rating: 4.7, icon: '🥩' },
            { name: 'Thịt lợn cắp nách nướng than hoa bản', rating: 4.6, icon: '🔥' },
            { name: 'Cơm lam ống tre dân tộc H\'Mông', rating: 4.5, icon: '🌾' },
            { name: 'Thắng cố ngựa chợ phiên Bắc Hà', rating: 4.4, icon: '🍲' }
          ],
          activityOptions: [
            { name: 'Cáp treo chinh phục đỉnh Fansipan 3143m', rating: 4.9, icon: '🚡' },
            { name: 'Trekking bản Cát Cát của người H\'Mông', rating: 4.8, icon: '🥾' },
            { name: 'Săn mây bình minh đèo Ô Quy Hồ', rating: 4.8, icon: '🌤️' },
            { name: 'Chụp ảnh ruộng bậc thang Mù Cang Chải', rating: 4.7, icon: '📸' },
            { name: 'Chợ phiên Bắc Hà cuối tuần sắc màu', rating: 4.6, icon: '🎪' }
          ]
        },
        'Ninh Bình': {
          foodOptions: [
            { name: 'Thịt dê núi đá Ninh Bình hấp & nướng', rating: 4.8, icon: '🐐' },
            { name: 'Cơm cháy chà bông giòn rụm Ninh Bình', rating: 4.8, icon: '🍚' },
            { name: 'Ốc núi luộc sả Tam Điệp - đặc sản lạ', rating: 4.6, icon: '🐌' },
            { name: 'Cá kho Ninh Bình - nồi đất ủ 12 tiếng', rating: 4.5, icon: '🫕' }
          ],
          activityOptions: [
            { name: 'Đi thuyền nan hang động Tràng An', rating: 4.9, icon: '🚣' },
            { name: 'Leo 500 bậc đá Hang Múa ngắm Tam Cốc', rating: 4.8, icon: '🧗' },
            { name: 'Vãn cảnh chùa Bái Đính - lớn nhất ĐNA', rating: 4.7, icon: '🏯' },
            { name: 'Khám phá Cố đô Hoa Lư ngàn năm lịch sử', rating: 4.7, icon: '🏛️' },
            { name: 'Đạp xe qua Cúc Phương - rừng quốc gia', rating: 4.6, icon: '🚴' }
          ]
        },
        'Đà Nẵng': {
          foodOptions: [
            { name: 'Mì Quảng Bà Vị - Trần Bình Trọng', rating: 4.8, icon: '🍜' },
            { name: 'Bánh tráng cuốn thịt heo chính hiệu', rating: 4.8, icon: '🥗' },
            { name: 'Gỏi cá Nam Ô truyền thống chuẩn vị', rating: 4.7, icon: '🐟' },
            { name: 'Bún chả cá Đà Nẵng thơm ngọt', rating: 4.7, icon: '🍲' },
            { name: 'Hải sản tươi An Hải - Mỹ Khê giá tốt', rating: 4.6, icon: '🦐' }
          ],
          activityOptions: [
            { name: 'Check-in Cầu Vàng - bàn tay Bà Nà Hills', rating: 4.9, icon: 'Bridge' },
            { name: 'Xem Cầu Rồng phun lửa & nước tối T7-CN', rating: 4.8, icon: '🐉' },
            { name: 'Tắm biển Mỹ Khê - top 6 bãi đẹp thế giới', rating: 4.8, icon: '🏖️' },
            { name: 'Khám phá Ngũ Hành Sơn & hang động', rating: 4.7, icon: '⛰️' },
            { name: 'Vui chơi Asia Park & Sun Wheel về đêm', rating: 4.6, icon: '🎡' }
          ]
        },
        'Hội An': {
          foodOptions: [
            { name: 'Cao lầu Bà Trưởng - Trần Phú chính gốc', rating: 4.9, icon: '🍜' },
            { name: 'Cơm gà bà Buội - Phan Châu Trinh', rating: 4.8, icon: '🍚' },
            { name: 'Bánh mì Phượng - Bánh mì ngon nhất TG', rating: 4.9, icon: '🥖' },
            { name: 'White Rose - Bánh bao vạc Hội An', rating: 4.7, icon: '🌹' },
            { name: 'Chè bắp - Chè đậu ván phố cổ', rating: 4.6, icon: '🍮' }
          ],
          activityOptions: [
            { name: 'Thả hoa đăng sông Hoài - đêm Rằm', rating: 4.9, icon: '🪔' },
            { name: 'Đi thuyền thúng Rừng dừa Cẩm Thanh', rating: 4.8, icon: '🚣' },
            { name: 'Tham quan phố cổ đèn lồng lung linh', rating: 4.8, icon: '🏮' },
            { name: 'Trải nghiệm làm đèn lồng thủ công', rating: 4.7, icon: '🎨' },
            { name: 'Đạp xe khám phá làng rau Trà Quế', rating: 4.6, icon: '🚴' }
          ]
        },
        'Huế': {
          foodOptions: [
            { name: 'Bún bò Huế Mệ Kéo - Nguyễn Công Trứ', rating: 4.9, icon: '🍲' },
            { name: 'Cơm hến Vĩ Dạ - Ăn sáng chuẩn Huế', rating: 4.8, icon: '🐚' },
            { name: 'Bánh bột lọc trần & gói lá chuối', rating: 4.7, icon: '🫙' },
            { name: 'Chè hẻm Huế - hơn 40 loại chè đặc sắc', rating: 4.8, icon: '🍮' },
            { name: 'Bánh canh Nam Phổ - đặc sản ít ai biết', rating: 4.6, icon: '🥣' }
          ],
          activityOptions: [
            { name: 'Tham quan Đại Nội - Hoàng thành Huế', rating: 4.9, icon: '🏯' },
            { name: 'Du thuyền rồng nghe Nhã nhạc sông Hương', rating: 4.8, icon: '🎶' },
            { name: 'Thăm lăng Khải Định & Tự Đức hoàng gia', rating: 4.8, icon: '👑' },
            { name: 'Dạo chợ Đông Ba - chợ lớn nhất miền Trung', rating: 4.5, icon: '🛒' },
            { name: 'Leo đồi Vọng Cảnh ngắm bình minh sông Hương', rating: 4.7, icon: '🌅' }
          ]
        },
        'Đà Lạt': {
          foodOptions: [
            { name: 'Bánh tráng nướng - pizza Đà Lạt đường phố', rating: 4.8, icon: '🍕' },
            { name: 'Lẩu gà lá é & Bánh căn lòng gà', rating: 4.7, icon: '🍲' },
            { name: 'Sữa đậu nành tươi & Bánh mì trứng hấp', rating: 4.6, icon: '🥚' },
            { name: 'Avocado shake & Strawberry farm Đà Lạt', rating: 4.7, icon: '🥑' },
            { name: 'Thịt nướng & Nem nướng Ninh Hòa chợ đêm', rating: 4.6, icon: '🔥' }
          ],
          activityOptions: [
            { name: 'Săn mây bình minh đồi chè Cầu Đất', rating: 4.9, icon: '☁️' },
            { name: 'Dạo hồ Xuân Hương & Quảng trường Lâm Viên', rating: 4.8, icon: '🌸' },
            { name: 'Cà phê view đẹp & chill tại The Married Beans', rating: 4.7, icon: '☕' },
            { name: 'Thăm vườn dâu - hái dâu tây Đà Lạt', rating: 4.6, icon: '🍓' },
            { name: 'Chợ đêm Đà Lạt mua sắm & ẩm thực đường phố', rating: 4.5, icon: '🌃' }
          ]
        },
        'TP.HCM': {
          foodOptions: [
            { name: 'Cơm tấm Ba Ghiền - Bùi Viện gia truyền', rating: 4.8, icon: '🍚' },
            { name: 'Bánh mì Huỳnh Hoa - dài nhất Sài Gòn', rating: 4.8, icon: '🥖' },
            { name: 'Hủ tiếu Nam Vang Nhân Quán - Bình Thạnh', rating: 4.7, icon: '🍜' },
            { name: 'Ốc nhớ Sài Gòn - Vũ Tùng Q.Bình Thạnh', rating: 4.6, icon: '🐌' },
            { name: 'Phá lấu bò cô Thảo & Lẩu bò nhúng dấm', rating: 4.6, icon: '🥩' },
            { name: 'Chè Hiển Khánh - đủ loại chè Nam Bộ', rating: 4.5, icon: '🍮' }
          ],
          activityOptions: [
            { name: 'Ngắm view đỉnh cao Landmark 81 & Bitexco', rating: 4.8, icon: '🏙️' },
            { name: 'Dạo phố đi bộ Nguyễn Huệ về đêm', rating: 4.9, icon: '🌃' },
            { name: 'Khám phá Bảo tàng Chứng tích Chiến tranh', rating: 4.7, icon: '🏛️' },
            { name: 'Mua sắm chợ Bến Thành & An Đông', rating: 4.5, icon: '🛍️' },
            { name: 'Du thuyền ngắm cảnh sông Sài Gòn đêm', rating: 4.7, icon: '🛥️' },
            { name: 'Trải nghiệm phố ẩm thực đường phố Bùi Viện', rating: 4.6, icon: '🎶' }
          ]
        },
        'Phú Quốc': {
          foodOptions: [
            { name: 'Bún quậy Thanh Hùng - Dương Đông chuẩn vị', rating: 4.8, icon: '🍜' },
            { name: 'Hải sản tươi làng chài Hàm Ninh', rating: 4.8, icon: '🦞' },
            { name: 'Gỏi cá trích Phú Quốc - đặc sản số 1', rating: 4.7, icon: '🐟' },
            { name: 'Ghẹ hấp bia & Tôm hùm nướng bơ tỏi', rating: 4.7, icon: '🦀' },
            { name: 'Bánh canh cá thu nước trong Phú Quốc', rating: 4.5, icon: '🥣' }
          ],
          activityOptions: [
            { name: 'Cáp treo vượt biển dài nhất TG - Hòn Thơm', rating: 4.9, icon: '🚡' },
            { name: 'Lặn ngắm san hô Nam Đảo & Hòn Mây Rút', rating: 4.8, icon: '🤿' },
            { name: 'Vui chơi VinWonders & Safari Phú Quốc', rating: 4.8, icon: '🦁' },
            { name: 'Tắm biển Bãi Sao - cát trắng mịn nước xanh', rating: 4.8, icon: '🏖️' },
            { name: 'Chụp ảnh hoàng hôn Sunset Sanato Bar', rating: 4.9, icon: '🌅' }
          ]
        },
        'Vũng Tàu': {
          foodOptions: [
            { name: 'Bánh khọt Cô Ba Vũng Tàu - phố Nguyễn Trãi', rating: 4.8, icon: '🥞' },
            { name: 'Lẩu cá đuối - đặc sản biển Vũng Tàu', rating: 4.7, icon: '🐟' },
            { name: 'Hải sản Bến Đá - tươi ngon giá bình dân', rating: 4.6, icon: '🦐' },
            { name: 'Bánh bèo Vũng Tàu - ăn sáng chuẩn vị', rating: 4.5, icon: '🍮' }
          ],
          activityOptions: [
            { name: 'Leo núi Lớn - Tượng Chúa Kitô giang tay', rating: 4.8, icon: '✝️' },
            { name: 'Tắm biển Bãi Sau - sóng lớn thư giãn', rating: 4.7, icon: '🏊' },
            { name: 'Cà phê view biển Bãi Trước hoàng hôn', rating: 4.7, icon: '☕' },
            { name: 'Thăm Bạch Dinh - Villa pháp cổ 100 năm', rating: 4.5, icon: '🏰' }
          ]
        }
      };
      const base = detailsMap[name] || defaultDetails;
      const opts = FOOD_ACTIVITY_MAP[name];
      return opts ? Object.assign({}, base, opts) : base;
    };

    // Active state tracking for options
    let activeOptionData = null; // Stores { el, name, type, icon, rating, province }

    window.switchOptionTab = function(tab) {
      const btnFood = document.getElementById('tabBtnFood');
      const btnAct = document.getElementById('tabBtnActivity');
      const paneFood = document.getElementById('tabPaneFood');
      const paneAct = document.getElementById('tabPaneActivity');
      
      if (tab === 'food') {
        btnFood.classList.add('active');
        btnAct.classList.remove('active');
        paneFood.classList.add('active');
        paneAct.classList.remove('active');
      } else {
        btnFood.classList.remove('active');
        btnAct.classList.add('active');
        paneFood.classList.remove('active');
        paneAct.classList.add('active');
      }
      closeOptionDetail();
    };

    window.renderProvinceOptions = function(provinceName, extra) {
      const gCont = document.getElementById('v2GourmetOptionsContainer');
      const aCont = document.getElementById('v2ActivityOptionsContainer');
      const gLabel = document.getElementById('v2GourmetCityName');
      const aLabel = document.getElementById('v2ActivityCityName');
      
      if (gLabel) gLabel.textContent = provinceName;
      if (aLabel) aLabel.textContent = provinceName;
      
      if (!gCont || !aCont) return;
      gCont.innerHTML = '';
      aCont.innerHTML = '';
      
      closeOptionDetail();

      const makeCard = (container, opt, type) => {
        const card = document.createElement('div');
        card.className = 'option-mini-card';
        card.setAttribute('data-val', opt.name);
        card.setAttribute('data-type', type);
        
        card.innerHTML = `
          <div class="omc-icon">${opt.icon}</div>
          <div class="omc-name">${opt.name}</div>
          <div class="omc-rating">★ ${opt.rating}</div>
          <div class="omc-hint">Click xem chi tiết</div>
        `;
        
        card.onclick = (e) => {
          e.stopPropagation();
          showOptionDetail(provinceName, type, opt.name, opt.icon, opt.rating, card);
        };
        
        container.appendChild(card);
      };

      (extra.foodOptions || []).forEach(o => makeCard(gCont, o, 'ẩm thực'));
      (extra.activityOptions || []).forEach(o => makeCard(aCont, o, 'hoạt động'));
      
      switchOptionTab('food');
    };

    window.showOptionDetail = function(provinceName, type, name, icon, rating, cardEl) {
      const panel = document.getElementById('optionDetailPanel');
      if (!panel) return;

      activeOptionData = { el: cardEl, name, type, icon, rating, province: provinceName };

      document.querySelectorAll('.option-mini-card').forEach(c => c.style.borderColor = 'rgba(255,255,255,0.07)');
      cardEl.style.borderColor = '#00e5ff';

      const detail = getOptionDetails(provinceName, type, name);
      
      document.getElementById('odpIconWrap').textContent = icon;
      document.getElementById('odpTitle').textContent = name;
      document.getElementById('odpNum').textContent = `${rating} / 5.0`;
      document.getElementById('odpBadge').textContent = type;
      document.getElementById('odpDesc').textContent = detail.desc;
      
      const starsHtml = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
      document.getElementById('odpStars').innerHTML = starsHtml.split('').map(s => `<span>${s}</span>`).join('');

      const infoRow = document.getElementById('odpInfoRow');
      infoRow.innerHTML = `
        <div class="odp-info-chip">📍 ${detail.address}</div>
        <div class="odp-info-chip">💰 ${detail.price}</div>
        <div class="odp-info-chip">🕒 ${detail.hours}</div>
      `;

      document.getElementById('odpTip').textContent = detail.tip;

      const btnAdd = document.getElementById('odpBtnAdd');
      if (cardEl.classList.contains('selected')) {
        btnAdd.textContent = '✓ Đã chọn trong lịch trình';
        btnAdd.classList.add('added');
      } else {
        btnAdd.textContent = '+ Thêm vào lịch trình';
        btnAdd.classList.remove('added');
      }

      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    window.toggleOptionFromDetail = function() {
      if (!activeOptionData) return;
      const { el, name } = activeOptionData;
      
      el.classList.toggle('selected');
      
      const btnAdd = document.getElementById('odpBtnAdd');
      if (el.classList.contains('selected')) {
        btnAdd.textContent = '✓ Đã chọn trong lịch trình';
        btnAdd.classList.add('added');
      } else {
        btnAdd.textContent = '+ Thêm vào lịch trình';
        btnAdd.classList.remove('added');
      }
      
      updateSelectedPreferences();
    };

    window.closeOptionDetail = function() {
      const panel = document.getElementById('optionDetailPanel');
      if (panel) panel.style.display = 'none';
      activeOptionData = null;
      document.querySelectorAll('.option-mini-card').forEach(c => {
        if (!c.classList.contains('selected')) {
          c.style.borderColor = 'rgba(255,255,255,0.07)';
        } else {
          c.style.borderColor = '#00e5ff';
        }
      });
    };

    window.updateSelectedPreferences = function() {
      const inp = document.getElementById('additionalInfo');
      if (!inp) return;
      
      const foods = [], acts = [];
      document.querySelectorAll('#v2GourmetOptionsContainer .option-mini-card.selected').forEach(el => foods.push(el.getAttribute('data-val')));
      document.querySelectorAll('#v2ActivityOptionsContainer .option-mini-card.selected').forEach(el => acts.push(el.getAttribute('data-val')));
      
      let txt = '';
      if (foods.length) txt += 'Ẩm thực muốn thử: ' + foods.join(', ') + '. ';
      if (acts.length) txt += 'Trải nghiệm muốn đi: ' + acts.join(', ') + '.';
      inp.value = txt.trim();
    };

    // ── getOptionDetails: rich detail data for each option card ──────────────
    window.getOptionDetails = function(provinceName, type, name) {
      const db = {
        // Hanoi food
        'Phở gia truyền Bát Đàn (Hoàn Kiếm)': {
          desc: 'Quán phở bò gia truyền nổi tiếng nhất Hà Nội với nước dùng thanh ngọt tự nhiên ninh từ xương bò nhiều giờ, bánh phở mềm mướt và thịt bò tươi ngon. Thực khách tự phục vụ và thanh toán trước theo kiểu phố cổ.',
          address: '49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội',
          price: '55.000đ – 75.000đ/tô',
          hours: '06:00 – 10:00 & 18:00 – 20:30',
          tip: '💡 Quán rất đông và thường phải xếp hàng, hãy đi sớm để tránh hết nước dùng. Chọn tô béo (thêm gầu, gân) để thưởng thức trọn vị!'
        },
        'Bún chả Đắc Kim - Hàng Mành': {
          desc: 'Thương hiệu bún chả lâu đời từ 1966. Chả băm và chả miếng nướng đậm đà trên than củi, ăn kèm nước chấm chua ngọt tỏi ớt và rổ rau sống tươi rói. Tổng thống Obama đã từng thưởng thức bún chả tại Hà Nội!',
          address: '1 Hàng Mành, Hoàn Kiếm, Hà Nội',
          price: '60.000đ – 90.000đ/suất',
          hours: '08:30 – 21:00',
          tip: '💡 Nếu đi 2 người sức ăn vừa, hãy gọi 1 suất bún chả + thêm 1 nem cua bể chiên giòn để chia nhau – siêu ngon!'
        },
        'Cà phê trứng Giảng - Hàng Gai': {
          desc: 'Nơi khai sinh cà phê trứng trứ danh Hà Nội. Lớp kem trứng đánh bông mịn màng, béo ngậy mà không tanh, kết hợp hoàn hảo với cà phê phin Robusta đậm đặc phía dưới.',
          address: 'Ngõ 39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội',
          price: '25.000đ – 45.000đ/ly',
          hours: '07:00 – 22:00',
          tip: '💡 Thử cà phê trứng nóng đặt trong bát nước ấm để giữ nhiệt và cacao trứng nếu bạn không uống được cà phê!'
        },
        'Chả cá Lã Vọng - Chả Cá phố': {
          desc: 'Chả cá lăng nướng vàng ươm trên chảo mỡ nóng cùng hành hoa, thì là, ăn kèm bún, đậu phộng rang và mắm tôm Thanh Hóa đánh sủi bọt. Món ăn huyền thoại của phố cổ Hà Nội hơn 100 năm tuổi.',
          address: '14 Chả Cá, Hoàn Kiếm, Hà Nội',
          price: '150.000đ – 180.000đ/suất',
          hours: '11:00 – 14:00 & 17:00 – 21:00',
          tip: '💡 Rưới một thìa mỡ nóng từ chảo vào bát bún rồi trộn đều cùng mắm tôm để thưởng thức đúng vị phố cổ!'
        },
        'Bún đậu mắm tôm Cô Lan - Hàng Khay': {
          desc: 'Mẹt bún đậu đầy đặn với đậu mơ chiên giòn ngoài mềm trong, chả cốm dẻo thơm, thịt chân giò luộc và mắm tôm Thanh Hóa thơm ngậy. Một trong những quán bún đậu được yêu thích nhất phố cổ.',
          address: 'Ngõ 31 Hàng Khay, Hoàn Kiếm, Hà Nội',
          price: '40.000đ – 80.000đ/mẹt',
          hours: '09:00 – 21:30',
          tip: '💡 Vắt nhiều quất và đánh mắm tôm sủi bọt trắng trước khi chấm. Thêm chút ớt chưng để đậm vị hơn!'
        },
        // Hanoi activities
        'Dạo bộ Hồ Gươm & Phố đi bộ Đinh Tiên Hoàng': {
          desc: 'Trái tim của thủ đô. Tản bộ dưới bóng cây rợp mát, ngắm Cầu Thê Húc đỏ son và Tháp Rùa cổ kính. Cuối tuần có hoạt động nghệ thuật đường phố, âm nhạc và trò chơi dân gian sôi động.',
          address: 'Quanh Hồ Hoàn Kiếm, trung tâm Hà Nội',
          price: 'Miễn phí tham quan',
          hours: 'Mở cả ngày (Phố đi bộ: tối Thứ 6 đến hết Chủ nhật)',
          tip: '💡 Thử kem Tràng Tiền hoặc kem Thủy Tạ sát bờ hồ – đặc sản tuổi thơ Hà Nội!'
        },
        'Xem Múa rối nước Nhà hát Thăng Long': {
          desc: 'Nghệ thuật sân khấu dân gian độc đáo của Việt Nam, tái hiện cuộc sống sinh hoạt nông nghiệp và truyền thuyết dân tộc trên mặt nước sinh động với nhạc cụ dân tộc sống động.',
          address: '57B Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội',
          price: '100.000đ – 200.000đ/vé',
          hours: 'Nhiều ca từ 15:00 – 21:00 hàng ngày',
          tip: '💡 Đặt vé trực tuyến trước 1-2 ngày để chọn được hàng ghế đầu ngắm rõ con rối và nhạc công biểu diễn!'
        },
        'Tour đêm Nhà tù Hỏa Lò độc đáo': {
          desc: 'Hành trình cảm xúc mang tên "Đêm thiêng liêng", đưa du khách cảm nhận tinh thần bất khuất của các chiến sĩ yêu nước tại "địa ngục trần gian" Hà Nội qua trình diễn nghệ thuật đặc sắc.',
          address: '1 Hỏa Lò, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
          price: '399.000đ/vé',
          hours: '19:00 – 20:30 (Thường tổ chức cuối tuần)',
          tip: '💡 Vé tour đêm cháy rất nhanh – canh lịch mở bán trên Fanpage di tích trước vài tuần!'
        },
        // Hoi An food
        'Cao lầu Bà Trưởng - Trần Phú chính gốc': {
          desc: 'Món mì đặc sản số 1 Hội An với sợi mì vàng dai độc đáo chỉ làm từ nước giếng Cham và tro củi của đảo Cù Lao Chàm. Ăn kèm thịt xá xíu, tôm, giá đỗ và bánh đa giòn.',
          address: '22 Trần Phú, Minh An, Hội An, Quảng Nam',
          price: '45.000đ – 65.000đ/tô',
          hours: '06:30 – 14:00',
          tip: '💡 Hỏi thêm "mì khô" (ít nước) để thưởng thức đúng kiểu truyền thống Hội An!'
        },
        'Bánh mì Phượng - Bánh mì ngon nhất TG': {
          desc: 'Được Anthony Bourdain gọi là "bánh mì ngon nhất thế giới". Vỏ bánh giòn, nhân đa dạng với pate, thịt nguội, chả lụa, rau thơm và tương ớt pha chế theo công thức bí truyền gia đình.',
          address: '2B Phan Châu Trinh, Minh An, Hội An',
          price: '25.000đ – 35.000đ/ổ',
          hours: '06:30 – 21:30',
          tip: '💡 Xếp hàng sớm trước 08:00 hoặc sau 14:00 để tránh đông đúc. Gọi thêm nước dứa ép tươi để ăn kèm!'
        },
        // Generic fallback
      };

      if (db[name]) return db[name];

      // Smart fallback based on type
      const isFood = (type === 'ẩm thực');
      return {
        desc: isFood
          ? `Đặc sản nổi bật mang đậm phong vị địa phương tại ${provinceName}. Được chế biến tỉ mỉ theo công thức cổ truyền, lưu giữ hương vị nguyên bản từ nguyên liệu tươi ngon đặc trưng của vùng đất này.`
          : `Trải nghiệm khám phá văn hóa và thiên nhiên nổi bật tại ${provinceName}, thu hút hàng nghìn du khách trong và ngoài nước mỗi năm. Một điểm đến không thể bỏ qua trong hành trình của bạn.`,
        address: `Khu vực trung tâm / phố du lịch chính tại ${provinceName}`,
        price: isFood ? '35.000đ – 120.000đ' : 'Miễn phí hoặc 50.000đ – 250.000đ',
        hours: isFood ? '07:00 – 22:00' : '08:00 – 17:30',
        tip: isFood
          ? `💡 Nên thưởng thức khi món ăn còn nóng hổi để cảm nhận trọn vẹn hương vị. Hỏi người dân địa phương để biết quán ngon nhất!`
          : `💡 Nên đến lúc sáng sớm hoặc chiều tà để có ánh sáng đẹp chụp ảnh và thời tiết dễ chịu nhất.`
      };
    };
    window.showDestReviewPanel = function(dest, photoUrl, cardEl) {
      // Highlight selected card
      document.querySelectorAll('.v2-dest-card').forEach(c => c.classList.remove('active'));
      if (cardEl) cardEl.classList.add('active');
      
      selectedDestination = dest.name;
      const inp = document.getElementById('dest');
      if (inp) inp.value = dest.name;
      if (typeof showCityAttractions === 'function') showCityAttractions(dest.name);

      // Populate review panel
      const panel = document.getElementById('v2DestReviewPanel');
      const img = document.getElementById('reviewPanelImg');
      const title = document.getElementById('reviewPanelTitle');
      const stars = document.getElementById('reviewPanelStars');
      const desc = document.getElementById('reviewPanelDesc');
      const spotsCont = document.getElementById('reviewPanelSpots');
      
      // Detailed panel items
      const bestTimeEl = document.getElementById('reviewBestTime');
      const highlightsList = document.getElementById('reviewHighlightsList');
      const gourmetCont = document.getElementById('reviewGourmetCont');
      const btnConfirmText = document.getElementById('btnReviewDestConfirmText');

      // Metric elements
      const sceneryText = document.getElementById('scoreSceneryText');
      const sceneryBar = document.getElementById('scoreSceneryBar');
      const foodText = document.getElementById('scoreFoodText');
      const foodBar = document.getElementById('scoreFoodBar');
      const costText = document.getElementById('scoreCostText');
      const costBar = document.getElementById('scoreCostBar');

      if (panel) {
        panel.style.display = 'block';
        if (img) img.style.backgroundImage = `url('${photoUrl}')`;
        if (title) title.textContent = dest.name;
        if (btnConfirmText) btnConfirmText.textContent = dest.name;
        
        // Stars rendering
        const ratingVal = parseFloat(dest.rating || '4.8');
        const fullStars = Math.floor(ratingVal);
        let starsHtml = '';
        for (let s = 1; s <= 5; s++) {
          if (s <= fullStars) {
            starsHtml += '<span class="review-star">★</span>';
          } else {
            starsHtml += '<span class="review-star empty">★</span>';
          }
        }
        starsHtml += `<span class="review-rating-num">${ratingVal.toFixed(1)} / 5.0</span>`;
        if (stars) stars.innerHTML = starsHtml;

        // Description
        if (desc) desc.textContent = dest.desc || 'Điểm đến tuyệt vời mang đậm nét bản sắc văn hóa địa phương Việt Nam với phong cảnh non nước thơ mộng và ẩm thực độc đáo.';

        // Load extra details
        const extra = getDestinationExtraDetails(dest.name);

        // Render scores
        if (sceneryText && sceneryBar) {
          sceneryText.textContent = `${extra.scores.scenery.toFixed(1)}/10`;
          sceneryBar.style.width = `${extra.scores.scenery * 10}%`;
        }
        if (foodText && foodBar) {
          foodText.textContent = `${extra.scores.food.toFixed(1)}/10`;
          foodBar.style.width = `${extra.scores.food * 10}%`;
        }
        if (costText && costBar) {
          costText.textContent = `${extra.scores.cost.toFixed(1)}/10`;
          costBar.style.width = `${extra.scores.cost * 10}%`;
        }

        // Render Best Time
        if (bestTimeEl) {
          bestTimeEl.textContent = extra.bestTime;
        }

        // Render Highlights List
        if (highlightsList) {
          highlightsList.innerHTML = '';
          extra.highlights.forEach(hl => {
            const li = document.createElement('li');
            li.style.fontSize = '0.8rem';
            li.style.color = 'rgba(255,255,255,0.85)';
            li.style.display = 'flex';
            li.style.alignItems = 'flex-start';
            li.style.gap = '0.4rem';
            li.innerHTML = `<span style="color:#fbbf24; flex-shrink:0;">✦</span> <span>${hl}</span>`;
            highlightsList.appendChild(li);
          });
        }

        // Render Gourmet Food Tags
        if (gourmetCont) {
          gourmetCont.innerHTML = '';
          extra.gourmet.forEach(food => {
            const chip = document.createElement('span');
            chip.className = 'review-spot-chip';
            chip.style.borderColor = 'rgba(16,185,129,0.3)';
            chip.style.background = 'rgba(16,185,129,0.06)';
            chip.style.color = '#a7f3d0';
            chip.textContent = food;
            gourmetCont.appendChild(chip);
          });
        }

        // Spots list
        if (spotsCont) {
          spotsCont.innerHTML = '';
          if (dest.spots) {
            dest.spots.forEach(spot => {
              const chip = document.createElement('span');
              chip.className = 'review-spot-chip';
              chip.textContent = spot;
              spotsCont.appendChild(chip);
            });
          }
        }

        // Render dynamic province food & activity options
        renderProvinceOptions(dest.name, extra);

        const optWidget = document.getElementById('optionWidget');
        if (optWidget) optWidget.style.display = 'block';

        // Smooth scroll to panel
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    window.closeDestReview = function() {
      const panel = document.getElementById('v2DestReviewPanel');
      if (panel) panel.style.display = 'none';
      const optWidget = document.getElementById('optionWidget');
      if (optWidget) optWidget.style.display = 'none';
      closeOptionDetail();
    };

    window.confirmDestFromReview = function() {
      if (!selectedDestination) {
        alert('Vui lòng chọn một điểm đến!');
        return;
      }
      goToWizardStep(2);
    };

    window.refreshDestinationsV2 = function() {
      const grid = document.getElementById('v2DestCardsGrid');
      if (!grid) return;
      grid.style.opacity = '0';
      setTimeout(() => { renderDestinationsV2(); grid.style.opacity = '1'; }, 300);
    };

    window.selectHotDestination = function(name, regionName) {
      selectRegionV2(regionName);
      selectedDestination = name;
      const inp = document.getElementById('dest');
      if (inp) inp.value = name;
      
      const destObj = (REGION_DESTINATIONS[regionName] || []).find(d => d.name === name);
      setTimeout(() => {
        document.querySelectorAll('.v2-dest-card').forEach(c => {
          const h4 = c.querySelector('h4');
          if (h4 && h4.textContent.trim() === name) {
            c.classList.add('active');
            c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (destObj) {
              const photoUrl = c.querySelector('.v2-dest-image').style.backgroundImage.slice(5, -2).replace(/['"]/g, '');
              showDestReviewPanel(destObj, photoUrl, c);
            }
          } else {
            c.classList.remove('active');
          }
        });
      }, 300);
    };

    function toggleStyle(chip) { chip.classList.toggle('active'); }

    function showComparisonView(plans, names, type = 'itinerary') {
      if (!plans || !Array.isArray(plans)) return;
      const resultsContainer = document.getElementById('timelineContent');
      if (!resultsContainer) return;
      const isTour = type === 'tour';
      const comparisonCardsHtml = plans.map((plan, idx) => {
        const name = (names && names[idx]) || `Lựa chọn ${idx + 1}`;
        const accentColor = idx % 2 === 0 ? '#2563eb' : '#d97706';
        const bgColor = idx % 2 === 0 ? '#f8fafc' : '#fffbeb';
        const borderColor = idx % 2 === 0 ? '#e2e8f0' : '#fef3c7';
        return `
          <div class="compare-card" style="background: ${bgColor}; border: 1px solid ${borderColor}; padding: 1.5rem; border-radius: 1.25rem; flex: 1; min-width: 300px;">
              <div class="analysis-label" style="color:${accentColor}; font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 1px solid ${borderColor}; padding-bottom: 0.5rem;">${name}</div>
              <div class="criteria-item" style="margin-bottom: 1rem;">
                <strong style="color: #475569; display: block; font-size: 0.8rem; text-transform: uppercase;">${isTour ? '✨ Đặc điểm Tour' : '🌟 Điểm nhấn'}</strong>
                <p style="margin: 0.25rem 0; font-size: 0.95rem; line-height: 1.4;">${plan?.tripSummary?.substring(0, 150) || 'Hành trình thú vị...'}...</p>
              </div>
              <div class="criteria-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem;">
                <div class="mini-crit">
                  <span style="display:block; font-size: 0.7rem; color: #94a3b8;">${isTour ? 'Đánh giá' : 'Mật độ khách'}</span>
                  <span style="font-weight: 600; color: #1e293b;">${isTour ? '⭐ ' + (plan.rating || '4.9') : (idx % 2 === 0 ? 'Vừa phải' : 'Khá đông')}</span>
                </div>
                <div class="mini-crit">
                  <span style="display:block; font-size: 0.7rem; color: #94a3b8;">${isTour ? 'Loại hình' : 'Di chuyển'}</span>
                  <span style="font-weight: 600; color: #1e293b;">${isTour ? 'Trọn gói' : (idx === 0 ? 'Dễ dàng' : 'Trung bình')}</span>
                </div>
                <div class="mini-crit">
                  <span style="display:block; font-size: 0.7rem; color: #94a3b8;">Tiện ích</span>
                  <span style="font-weight: 600; color: #1e293b;">${isTour ? 'Đã bao gồm phí' : 'Cơ bản'}</span>
                </div>
                <div class="mini-crit">
                  <span style="display:block; font-size: 0.7rem; color: #94a3b8;">Độ linh hoạt</span>
                  <span style="font-weight: 600; color: #1e293b;">${isTour ? 'Cố định' : 'Cao'}</span>
                </div>
                <div class="mini-crit" style="grid-column: span 2; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 0.5rem;">
                  <span style="display:block; font-size: 0.7rem; color: #94a3b8;">${isTour ? 'Giá Tour' : 'Chi phí dự kiến'}</span>
                  <span style="font-weight: 700; color: #059669; font-size: 1.1rem;">${plan.estimatedCost || plan.totalEstimatedCost || '5.500.000'} VNĐ</span>
                </div>
              </div>
          </div>
        `;
      }).join('');

      const analysisHtml = `
        <div class="comparison-summary-card" style="grid-column: 1 / -1; margin-bottom: 2rem; background: #ffffff; color: #1e293b;">
          <div class="compare-card-title" style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem;">⚖️ Bảng So Sánh & Đánh Giá Tổng Hợp (${isTour ? 'Tour' : 'Lịch trình'})</div>
          
          <div class="comparison-container" style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: 1.5rem;">
            ${comparisonCardsHtml}
          </div>

          <div class="compare-conclusion" style="margin-top: 2rem; padding: 1.5rem; background: #f0fdf4; border-radius: 1rem; border: 1px solid #dcfce7;">
             <h4 style="margin: 0 0 1rem 0; color: #166534; display: flex; align-items: center; gap: 0.5rem;">✨ Kết luận từ WanderAI</h4>
             <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #14532d; line-height: 1.5;">
               Dựa trên ${plans.length} lựa chọn trên, nếu bạn ưu tiên <strong>${isTour ? 'chất lượng dịch vụ' : 'ngân sách'}</strong> hãy chọn <strong>${names[0]}</strong>. 
               Để có <strong>trải nghiệm ${isTour ? 'đặc sắc' : 'đa dạng'} nhất</strong>, <strong>${names[plans.length-1]}</strong> là lựa chọn không thể bỏ qua.
             </p>

             <!-- Bảng phần trăm phù hợp (N-Bản) -->
             <div class="percentage-score-table" style="background: white; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #dcfce7;">
                <div style="font-weight: 800; font-size: 0.9rem; color: #166534; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">📊 Chỉ số phù hợp (%)</div>
                
                <div class="score-row" style="display: flex; flex-direction: column; gap: 1.5rem;">
                  <!-- Tiêu chí 1: Ngân sách -->
                  <div class="score-item">
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem; color: #1e293b;">Tối ưu ngân sách</div>
                    ${plans.map((p, i) => {
                      const score = 95 - (i * 5); // Dummy calculation
                      return `
                        <div style="margin-bottom: 0.5rem;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem;">
                            <span>${names[i]}</span>
                            <span>${score}%</span>
                          </div>
                          <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${score}%; background: #22c55e;"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Tiêu chí 2: Văn hóa -->
                  <div class="score-item">
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem; color: #1e293b;">Trải nghiệm văn hóa</div>
                    ${plans.map((p, i) => {
                      const score = 70 + (i * 8); 
                      return `
                        <div style="margin-bottom: 0.5rem;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem;">
                            <span>${names[i]}</span>
                            <span>${score}%</span>
                          </div>
                          <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${score}%; background: #3b82f6;"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Tiêu chí 3: Nghỉ dưỡng -->
                  <div class="score-item">
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem; color: #1e293b;">Mức độ nghỉ dưỡng & Thư giãn</div>
                    ${plans.map((p, i) => {
                      const score = 80 - (i * 4); 
                      return `
                        <div style="margin-bottom: 0.5rem;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem;">
                            <span>${names[i]}</span>
                            <span>${score}%</span>
                          </div>
                          <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${score}%; background: #8b5cf6;"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Tiêu chí 4: Giải trí -->
                  <div class="score-item">
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem; color: #1e293b;">Hoạt động giải trí & Vui chơi</div>
                    ${plans.map((p, i) => {
                      const score = 65 + (i * 10); 
                      return `
                        <div style="margin-bottom: 0.5rem;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem;">
                            <span>${names[i]}</span>
                            <span>${score > 100 ? 100 : score}%</span>
                          </div>
                          <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${score > 100 ? 100 : score}%; background: #ec4899;"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
             </div>
          </div>
        </div>
      `;
      
      const oldCard = document.querySelector('.comparison-summary-card');
      if (oldCard) oldCard.remove();
      
      resultsContainer.insertAdjacentHTML('afterbegin', analysisHtml);
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Comparison Mode Navigation - Now handled by planner.js
    let currentCompareType = 'itinerary';
    let selectedTourIds = [];

    window.switchCompareType = function(type) {
      currentCompareType = type;
      document.querySelectorAll('.compare-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
      });
      
      const tripList = document.getElementById('savedTripsList');
      const tourList = document.getElementById('availableToursList');
      const filterBar = document.querySelector('.compare-filter-bar');
      const title = document.getElementById('compareHeaderTitle');
      const sub = document.getElementById('compareHeaderSub');

      const itineraryAction = document.getElementById('itineraryCompareAction');
      const tourAction = document.getElementById('tourCompareAction');

      if (type === 'itinerary') {
        tripList.style.display = 'block';
        tourList.style.display = 'none';
        itineraryAction.style.display = 'block';
        tourAction.style.display = 'none';
        filterBar.style.display = 'flex';
        title.textContent = '⚖️ So sánh lịch trình';
        sub.textContent = 'Chọn một lịch trình đã lưu để đối chiếu với bản hiện tại';
        loadSavedTripsForComparison();
      } else {
        tripList.style.display = 'none';
        tourList.style.display = 'block';
        itineraryAction.style.display = 'none';
        tourAction.style.display = 'block';
        filterBar.style.display = 'none';
        title.textContent = '🚀 So sánh Tour';
        sub.textContent = 'Chọn các tour có sẵn để phân tích chi phí & tiện ích';
        loadToursForComparison();
      }
    };

    window.loadToursForComparison = async function() {
      const list = document.getElementById('availableToursList');
      if (!list) return;
      list.innerHTML = '<div class="loading-spinner-small"></div>';
      
      try {
        const res = await fetch('/api/places?isTour=true&limit=20');
        const json = await res.json();
        const tours = json.data || [];
        
        if (tours.length > 0) {
          list.innerHTML = tours.map(tour => `
            <div class="saved-trip-item-v2" onclick="toggleTourSelection(this, '${tour._id}')">
              <div class="trip-selection-check">
                <input type="checkbox" id="check_tour_${tour._id}" class="trip-checkbox" ${selectedTourIds.includes(tour._id) ? 'checked' : ''}>
              </div>
              <div class="trip-info">
                <strong>📦 ${tour.name}</strong>
                <p>📍 ${tour.region || 'Việt Nam'} - 💰 ${new Intl.NumberFormat('vi-VN').format(tour.priceFrom || 0)}đ</p>
              </div>
            </div>
          `).join('') + `
            <div class="compare-help-note" style="margin-top: 1rem; border:none; background:transparent; padding:0.5rem; opacity:0.6;">
               <p>✨ Bạn có thể chọn tối đa 3 tour để đối chiếu chi phí và tiện ích.</p>
            </div>
          `;
          
          const actionBox = document.getElementById('tourCompareAction');
          if (actionBox) {
            actionBox.innerHTML = `
              <button id="btnStartTourCompare" class="planner-btn" style="background: ${selectedTourIds.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'}; width:100%; border:none; box-shadow: ${selectedTourIds.length < 2 ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)'};" ${selectedTourIds.length < 2 ? 'disabled' : ''} onclick="startTourComparison()">
                🚀 So sánh <span id="tourCompareCount">${selectedTourIds.length}</span> Tour du lịch
              </button>
            `;
          }
        } else {
          list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Hiện chưa có tour nào khả dụng.</p>';
          const actionBox = document.getElementById('tourCompareAction');
          if (actionBox) actionBox.innerHTML = '';
        }
      } catch (e) {
        list.innerHTML = '<p style="color:#f43f5e; text-align:center; padding:2rem;">Không thể tải danh sách tour.</p>';
      }
    };

    window.toggleTourSelection = function(el, id) {
      const idx = selectedTourIds.indexOf(id);
      if (idx > -1) {
        selectedTourIds.splice(idx, 1);
        el.classList.remove('selected-for-compare');
      } else {
        if (selectedTourIds.length >= 3) {
          WanderToast.info("Chỉ nên so sánh tối đa 3 phương án để đạt hiệu quả cao nhất.");
          return;
        }
        selectedTourIds.push(id);
        el.classList.add('selected-for-compare');
      }
      
      const checkbox = el.querySelector('.trip-checkbox');
      if (checkbox) checkbox.checked = selectedTourIds.includes(id);
      
      const btn = document.getElementById('btnStartTourCompare');
      const count = document.getElementById('tourCompareCount');
      if (btn) {
        btn.disabled = selectedTourIds.length < 2;
        btn.style.background = selectedTourIds.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #2563eb)';
        btn.style.boxShadow = selectedTourIds.length < 2 ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)';
      }
      if (count) count.textContent = selectedTourIds.length;
    };

    window.startTourComparison = async function() {
      if (selectedTourIds.length < 2) return;
      
      // Show loader
      const loader = document.getElementById('aiLoader');
      if (loader) loader.style.display = 'flex';
      
      try {
        const promises = selectedTourIds.map(id => 
          fetch(`/api/places/${id}`)
            .then(r => r.json())
            .catch(err => ({ success: false, error: err.message }))
        );
        const results = await Promise.all(promises);
        const tourData = results.filter(r => r.success && r.data).map(r => r.data);
        
        if (tourData.length < 1) {
          if (window.WanderToast) WanderToast.error("Không thể tải thông tin các tour đã chọn.");
          return;
        }

        // Prepare data for rendering
        const plans = tourData.map(t => ({
          tripSummary: t.description || t.text || 'Không có mô tả chi tiết.',
          estimatedCost: new Intl.NumberFormat('vi-VN').format(t.priceFrom || 0),
          highlights: t.highlights || [],
          rating: t.rating || 4.8
        }));
        const names = tourData.map(t => t.name || 'Tour chưa rõ tên');
        
        showComparisonView(plans, names, 'tour');

        // Hiện vùng kết quả
        const resultContainer = document.getElementById('timelineResult');
        const placeholder = document.getElementById('resultPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        if (resultContainer) resultContainer.style.display = 'block';

        resultContainer.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        console.error("Tour comparison error:", e);
      } finally {
        if (loader) loader.style.display = 'none';
      }
    };

    window.loadSavedTripsForComparison = async function() {
      const list = document.getElementById('savedTripsList');
      if (!list) return;
      list.innerHTML = '<div class="loading-spinner-small"></div>';
      
      try {
        const token = localStorage.getItem('wander_token');
        if (!token) {
          list.innerHTML = `
            <div class="auth-required-box">
              <p>Vui lòng đăng nhập để xem các lịch trình đã lưu.</p>
              <a href="/login.html" class="btn-login-small">Đăng nhập ngay</a>
            </div>
          `;
          return;
        }
        
        const res = await fetch('/api/planner/my-trips', {
          headers: { 'x-auth-token': token }
        });
        const json = await res.json();
        
        // Lưu trữ dữ liệu gốc để filter
        window._allSavedTrips = json.data || [];
        filterComparisonTrips('all'); // Mặc định hiện tất cả
      } catch (e) {
        list.innerHTML = '<p style="color:#f43f5e; text-align:center; padding:2rem;">Không thể tải danh sách.</p>';
      }
    }

    window.filterComparisonTrips = function(status) {
      // Update UI tabs
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.status === status);
      });

      const list = document.getElementById('savedTripsList');
      if (!list || !window._allSavedTrips) return;

      let filtered;
      if (status === 'all') {
        filtered = window._allSavedTrips;
      } else if (status === 'deleted') {
        filtered = window._allSavedTrips.filter(t => t.isDeleted === true);
      } else {
        filtered = window._allSavedTrips.filter(t => t.status === status && !t.isDeleted);
      }

      if (filtered.length > 0) {
        list.innerHTML = filtered.map(trip => {
          let statusBadge = '';
          if (trip.status === 'completed') statusBadge = '<span class="trip-badge-mini completed">Đã đi</span>';
          if (trip.status === 'missed') statusBadge = '<span class="trip-badge-mini missed">Bỏ lỡ</span>';
          if (trip.isDeleted) statusBadge = '<span class="trip-badge-mini deleted">Đã xóa</span>';

          return `
            <div class="saved-trip-item-v2" onclick="toggleTripSelection(this, '${trip._id}')">
              <div class="trip-selection-check">
                <input type="checkbox" id="check_${trip._id}" class="trip-checkbox" ${selectedTripIds.includes(trip._id) ? 'checked' : ''}>
              </div>
              <div class="trip-info">
                <strong>📍 ${trip.destination}</strong> ${statusBadge}
                <p>${trip.days} ngày - ${new Date(trip.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          `;
        }).join('') + `
          <div class="compare-help-note" style="margin-top: 1rem; border:none; background:transparent; padding:0.5rem; opacity:0.6;">
             <p>✨ Bạn có thể chọn tối đa 3 bản để AI phân tích chuyên sâu.</p>
          </div>
        `;
        
        const actionBox = document.getElementById('itineraryCompareAction');
        if (actionBox) {
          actionBox.innerHTML = `
            <button id="btnStartMultiCompare" class="planner-btn" style="background: ${selectedTripIds.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'}; width:100%; border:none; box-shadow: ${selectedTripIds.length < 2 ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)'};" ${selectedTripIds.length < 2 ? 'disabled' : ''}>
              🚀 So sánh <span id="compareCount">${selectedTripIds.length}</span> lịch trình
            </button>
            ${selectedTripIds.length < 2 ? '<p style="font-size:0.7rem; color:var(--text-muted); text-align:center; margin-top:0.75rem; font-weight:600;">Chọn ít nhất 2 bản để so sánh</p>' : ''}
          `;
          const btn = document.getElementById('btnStartMultiCompare');
          if (btn) btn.onclick = startMultiCompare;
        }
      } else {
        const labels = { all: 'tất cả', planning: 'Đang lên lịch', completed: 'Đã đi', missed: 'Bỏ lỡ', deleted: 'Đã xóa' };
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem;">Bạn chưa có lịch trình nào ở trạng thái ${labels[status]}.</p>`;
        const actionBox = document.getElementById('itineraryCompareAction');
        if (actionBox) actionBox.innerHTML = '';
      }
    }

    let selectedTripIds = [];

    window.toggleTripSelection = function(el, id) {
      const checkbox = el.querySelector('.trip-checkbox');
      if (selectedTripIds.includes(id)) {
        selectedTripIds = selectedTripIds.filter(i => i !== id);
        el.classList.remove('selected-for-compare');
        if (checkbox) checkbox.checked = false;
      } else {
        selectedTripIds.push(id);
        el.classList.add('selected-for-compare');
        if (checkbox) checkbox.checked = true;
      }
      
      // Cập nhật trạng thái nút và counter
      const countEl = document.getElementById('compareCount');
      const btn = document.getElementById('btnStartMultiCompare');
      const actionArea = document.getElementById('compareActionArea');

      if (countEl) countEl.textContent = selectedTripIds.length;
      if (btn) {
        btn.disabled = selectedTripIds.length < 2;
        btn.style.background = selectedTripIds.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #2563eb)';
        btn.style.boxShadow = selectedTripIds.length < 2 ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)';
        
        // Cập nhật hint text
        let hint = btn.nextElementSibling;
        if (selectedTripIds.length < 2) {
          if (!hint || hint.tagName !== 'P') {
            btn.insertAdjacentHTML('afterend', '<p style="font-size:0.7rem; color:var(--text-muted); text-align:center; margin-top:0.75rem; font-weight:600;">Chọn ít nhất 2 bản để so sánh</p>');
          }
        } else {
          if (hint && hint.tagName === 'P') hint.remove();
        }
      }
    };

    async function startMultiCompare() {
       if (selectedTripIds.length === 0) return;
       
       const loader = document.getElementById('aiLoader');
       const resultContainer = document.getElementById('timelineResult');
       const placeholder = document.getElementById('resultPlaceholder');
       
       if (loader) loader.style.display = 'flex';
       
        try {
         const token = localStorage.getItem('wander_token');
         const history = window.WanderPlanner.getPlanHistory() || [];
         const currentIndex = window.WanderPlanner.getCurrentPlanIndex();
         const currentPlan = history[currentIndex] || null;
         
         const plansToCompare = [];
         const planNames = [];
         
         // Lấy dữ liệu cho từng ID đã chọn
         for (const id of selectedTripIds) {
           const res = await fetch(`/api/planner/itinerary/${id}`, {
             headers: { 'x-auth-token': token || '' }
           });
           const json = await res.json();
           if (json.success) {
             plansToCompare.push(json.data.planJson);
             planNames.push(json.data.destination);
           }
         }
         
         const wizardData = window.WanderPlanner.getWizardData() || {};
         const currentDest = wizardData.destination || 'Bản hiện tại';
         
         // Nếu có bản hiện tại, đưa vào danh sách so sánh luôn
         if (currentPlan) {
            plansToCompare.unshift(currentPlan);
            planNames.unshift(currentDest);
         }

         if (plansToCompare.length > 1) {
           window.WanderPlanner.renderMultiItinerary(plansToCompare, planNames);
           setTimeout(() => { if (typeof showComparisonView === 'function') showComparisonView(plansToCompare, planNames); }, 500);
         } else if (plansToCompare.length === 1) {
            window.WanderPlanner.renderItinerary(plansToCompare[0], planNames[0], 3);
         }
         
         // Ẩn các nút không cần thiết trong chế độ so sánh lịch trình cũ
         const saveBtn = document.getElementById('btnSaveTrip');
         if (saveBtn) saveBtn.style.display = 'none';
         
         // Thêm class để ẩn chi tiết hoạt động (chỉ hiện đánh giá tổng quan)
         const container = document.getElementById('timelineContent');
         if (container) container.classList.add('comparison-mode-active');
         
         // Hiện vùng kết quả
         if (placeholder) placeholder.style.display = 'none';
         if (resultContainer) resultContainer.style.display = 'block';

         resultContainer.scrollIntoView({ behavior: 'smooth' });
         
       } catch (e) {
         console.error("Multi-Compare Error:", e);
         if (window.WanderToast) WanderToast.error("Không thể thực hiện so sánh.");
       } finally {
         if (loader) loader.style.display = 'none';
       }
    }

    window.compareWithSavedTrip = async function(id) {
       // Function cũ, giữ lại để tương thích nếu cần
    };

    btnModeCompare?.addEventListener('click', () => {
      if (typeof window.switchCompareType === 'function') {
        window.switchCompareType('itinerary');
      }
    });

    window.WanderPlanner.triggerComparison = async function(savedTripId) {
       const loader = document.getElementById('aiLoader');
       if (loader) loader.style.display = 'flex';
       
       try {
         const token = localStorage.getItem('wander_token');
         const res = await fetch(`/api/planner/itinerary/${savedTripId}`, {
           headers: { 'x-auth-token': token || '' }
         });
         const json = await res.json();
         
         if (json.success && json.data) {
           const savedPlan = json.data.planJson;
           window.WanderPlanner.renderItinerary = (p, dst, d, dt) => renderItinerary(p, dst, d, dt);
           window.WanderPlanner.renderMultiItinerary = (ps, dsts) => renderMultiItinerary(ps, dsts);
           const history = window.WanderPlanner.getPlanHistory() || [];
           const currentIndex = window.WanderPlanner.getCurrentPlanIndex();
           const currentPlan = history[currentIndex] || null;
           
           if (!currentPlan) {
             // Nếu chưa có lịch trình hiện tại, chỉ render 1 bản đã lưu nhưng vẫn ở mode dual chuẩn bị
             renderItinerary(savedPlan, json.data.destination, json.data.days);
             if (window.WanderToast) WanderToast.info("Đã tải lịch trình đã lưu. Hãy tạo thêm một bản để so sánh!");
           } else {
             // Render 2 bản: Hiện tại và Đã lưu
             renderDualItinerary(currentPlan, savedPlan, SmartWizard.data.destination || 'Chuyến đi', SmartWizard.data.days || 3);
             
             // Tự động phân tích
             setTimeout(() => {
               if (typeof showComparisonView === 'function') showComparisonView();
             }, 500);
           }
           
           document.getElementById('timelineResult')?.scrollIntoView({ behavior: 'smooth' });
         }
       } catch (e) {
         console.error("Comparison Error:", e);
       } finally {
         if (loader) loader.style.display = 'none';
       }
    };