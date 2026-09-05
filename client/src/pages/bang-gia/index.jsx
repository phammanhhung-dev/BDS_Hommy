import React, { useEffect, useState } from "react";
import Header from "../../components/header";
import Footer from "../../components/footer";
import "./bang-gia.css";
import { setPageSEO, SITE_URL } from "../../utils/seo";

function BangGia() {
  const [activeTab, setActiveTab] = useState("thue");

  useEffect(() => {
    setPageSEO({
      title: "Bảng giá nhà đất TP.HCM - Hommy",
      description: "Tham khảo bảng giá thuê và mua bán nhà đất, căn hộ, biệt thự, đất nền theo từng quận tại TP. Hồ Chí Minh.",
      canonical: `${SITE_URL}/bang-gia`,
    });
  }, []);
  
  const priceData = {
    thue: [
      { khuVuc: "Quận 1", datNen: "N/A", canHo: "8 - 15 triệu", nhaRieng: "15 - 30 triệu" },
      { khuVuc: "Quận 2", datNen: "N/A", canHo: "7 - 13 triệu", nhaRieng: "12 - 25 triệu" },
      { khuVuc: "Quận 3", datNen: "N/A", canHo: "7.5 - 14 triệu", nhaRieng: "14 - 28 triệu" },
      { khuVuc: "Quận 4", datNen: "N/A", canHo: "6.5 - 12 triệu", nhaRieng: "11 - 22 triệu" },
      { khuVuc: "Quận 5", datNen: "N/A", canHo: "6 - 11 triệu", nhaRieng: "10 - 20 triệu" },
      { khuVuc: "Quận 7", datNen: "N/A", canHo: "7 - 13 triệu", nhaRieng: "12 - 26 triệu" },
      { khuVuc: "Quận Gò Vấp", datNen: "N/A", canHo: "5 - 9 triệu", nhaRieng: "8 - 18 triệu" },
      { khuVuc: "Quận Bình Thạnh", datNen: "N/A", canHo: "6 - 11 triệu", nhaRieng: "10 - 22 triệu" }
    ],
    ban: [
      { khuVuc: "Quận 1", datNen: "120 - 200 triệu/m²", canHo: "45 - 80 triệu/m²", nhaRieng: "80 - 150 triệu/m²" },
      { khuVuc: "Quận 2", datNen: "80 - 150 triệu/m²", canHo: "40 - 70 triệu/m²", nhaRieng: "70 - 130 triệu/m²" },
      { khuVuc: "Quận 3", datNen: "100 - 180 triệu/m²", canHo: "42 - 75 triệu/m²", nhaRieng: "75 - 140 triệu/m²" },
      { khuVuc: "Quận 4", datNen: "70 - 120 triệu/m²", canHo: "38 - 65 triệu/m²", nhaRieng: "65 - 120 triệu/m²" },
      { khuVuc: "Quận 5", datNen: "65 - 110 triệu/m²", canHo: "35 - 60 triệu/m²", nhaRieng: "60 - 110 triệu/m²" },
      { khuVuc: "Quận 7", datNen: "75 - 130 triệu/m²", canHo: "40 - 70 triệu/m²", nhaRieng: "70 - 130 triệu/m²" },
      { khuVuc: "Quận Gò Vấp", datNen: "40 - 70 triệu/m²", canHo: "30 - 50 triệu/m²", nhaRieng: "50 - 90 triệu/m²" },
      { khuVuc: "Quận Bình Thạnh", datNen: "55 - 90 triệu/m²", canHo: "35 - 60 triệu/m²", nhaRieng: "60 - 110 triệu/m²" }
    ]
  };

  return (
    <div className="bang-gia">
      <Header />
      <main className="bang-gia__container">
        <header className="bang-gia__header">
          <h1 className="bang-gia__title">Bảng Giá Bất Động Sản</h1>
          <p className="bang-gia__subtitle">Tham khảo giá thuê và giá bán nhà đất, căn hộ, đất nền theo từng khu vực tại TP.HCM</p>
        </header>

        <div className="bang-gia__tabs">
          <button
            className={`bang-gia__tab ${activeTab === "thue" ? "active" : ""}`}
            onClick={() => setActiveTab("thue")}
          >
            Nhà Đất Cho Thuê
          </button>
          <button
            className={`bang-gia__tab ${activeTab === "ban" ? "active" : ""}`}
            onClick={() => setActiveTab("ban")}
          >
            Nhà Đất Bán
          </button>
        </div>

        <div className="bang-gia__content">
          <div className="bang-gia__table-wrapper">
            <table className="bang-gia__table">
              <thead>
                <tr>
                  <th>Khu Vực</th>
                  <th>Đất Nền</th>
                  <th>Căn Hộ</th>
                  <th>Nhà Riêng</th>
                </tr>
              </thead>
              <tbody>
                {priceData[activeTab].map((item, index) => (
                  <tr key={index}>
                    <td className="bang-gia__khu-vuc">{item.khuVuc}</td>
                    <td>{item.datNen}</td>
                    <td>{item.canHo}</td>
                    <td>{item.nhaRieng}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bang-gia__note">
            <h3>Ghi chú:</h3>
            <ul>
              <li>Giá tham khảo, có thể thay đổi tùy theo vị trí, diện tích và chất lượng</li>
              <li>Đơn vị: triệu VND/tháng (đối với cho thuê) và triệu VND/m² (đối với bán)</li>
              <li>Dữ liệu cập nhật tháng 9 năm 2025</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BangGia;
