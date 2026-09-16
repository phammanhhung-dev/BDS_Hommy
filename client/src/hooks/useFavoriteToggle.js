import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import yeuThichApi from "../api/yeuThichApi";

/**
 * Lấy ID người dùng hiện tại từ localStorage
 */
export const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("currentUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      const actual = parsed.user ?? parsed;
      const id = actual?.NguoiDungID ?? actual?.id ?? actual?.userId;
      if (id) return Number(id);
    }
  } catch {
    /* ignore */
  }
  const idKey = localStorage.getItem("userId");
  if (idKey && !isNaN(Number(idKey))) return Number(idKey);
  return null;
};

/**
 * Hook quản lý toggle yêu thích BĐS (Optimistic UI, Toast, Event Sync, Fallback)
 * @param {Function} setItems - Hàm set state danh sách BĐS (vd: setProperties hoặc setTindangs)
 */
export function useFavoriteToggle(setItems) {
  const [toastMessage, setToastMessage] = useState(null);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);
  const navigate = useNavigate();

  // Hiển thị thông báo nhỏ tự ẩn sau 2.5s
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Lắng nghe sự kiện toggle yêu thích từ các component khác trên cùng trang hoặc Header
  useEffect(() => {
    const handleFavUpdated = (e) => {
      if (!e?.detail || typeof setItems !== "function") return;
      const { tinId, isFavorite } = e.detail;
      setItems((prev) =>
        prev.map((item) => {
          const itemId = item.TinDangID ?? item.id ?? item._id;
          if (itemId === tinId && item.isFavorite !== isFavorite) {
            return { ...item, isFavorite };
          }
          return item;
        })
      );
    };

    const handleFavsLoaded = (e) => {
      const favList = e?.detail?.favorites;
      if (!Array.isArray(favList) || typeof setItems !== "function") return;
      const favSet = new Set(favList.map((f) => Number(f.TinDangID ?? f.id ?? f._id)));
      setItems((prev) =>
        prev.map((item) => {
          const id = Number(item.TinDangID ?? item.id ?? item._id);
          const nextFav = favSet.has(id);
          if (item.isFavorite !== nextFav) {
            return { ...item, isFavorite: nextFav };
          }
          return item;
        })
      );
    };

    window.addEventListener("favoritesUpdated", handleFavUpdated);
    window.addEventListener("favoritesLoaded", handleFavsLoaded);

    return () => {
      window.removeEventListener("favoritesUpdated", handleFavUpdated);
      window.removeEventListener("favoritesLoaded", handleFavsLoaded);
    };
  }, [setItems]);

  // Xử lý lưu / bỏ lưu tin yêu thích nhanh (Toggle)
  const handleToggleFavorite = useCallback(
    async (e, tin) => {
      if (e) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
      }

      const tinId = tin?.TinDangID ?? tin?.id ?? tin?._id;
      if (!tinId) return;

      const userId = getCurrentUserId();
      if (!userId) {
        showToast("Vui lòng đăng nhập để lưu tin bất động sản!");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
        return;
      }

      const isFav = !!tin.isFavorite;
      const nextFav = !isFav;
      setFavoriteLoadingId(tinId);

      // 1. Optimistic UI update ngay lập tức
      if (typeof setItems === "function") {
        setItems((prev) =>
          prev.map((item) => {
            const itemId = item.TinDangID ?? item.id ?? item._id;
            return itemId === tinId ? { ...item, isFavorite: nextFav } : item;
          })
        );
      }

      // 2. Bắn sự kiện đồng bộ số đếm trên Header và các component khác
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", {
          detail: { tinId, isFavorite: nextFav, tinDang: { ...tin, isFavorite: nextFav } }
        })
      );

      try {
        // 3. Gọi API toggle yêu thích chính thức
        const res = await yeuThichApi.toggle({ NguoiDungID: userId, TinDangID: tinId });
        const actualFav = res?.data?.isFavorite ?? nextFav;
        showToast(actualFav ? "Đã lưu vào danh sách yêu thích ♥" : "Đã xóa khỏi danh sách yêu thích");
      } catch (err) {
        console.warn("[useFavoriteToggle] Toggle favorite error, attempting fallback:", err);
        // Fallback gọi remove hoặc add nếu toggle gặp sự cố
        try {
          if (nextFav) {
            await yeuThichApi.add({ NguoiDungID: userId, TinDangID: tinId });
            showToast("Đã lưu vào danh sách yêu thích ♥");
          } else {
            await yeuThichApi.remove(userId, tinId);
            showToast("Đã xóa khỏi danh sách yêu thích");
          }
        } catch (fallbackErr) {
          console.error("[useFavoriteToggle] Rollback favorite error:", fallbackErr);
          // Rollback giao diện nếu cả 2 đều lỗi
          if (typeof setItems === "function") {
            setItems((prev) =>
              prev.map((item) => {
                const itemId = item.TinDangID ?? item.id ?? item._id;
                return itemId === tinId ? { ...item, isFavorite: isFav } : item;
              })
            );
          }
          window.dispatchEvent(
            new CustomEvent("favoritesUpdated", {
              detail: { tinId, isFavorite: isFav, tinDang: { ...tin, isFavorite: isFav } }
            })
          );
          showToast("Không thể cập nhật yêu thích. Vui lòng thử lại!");
        }
      } finally {
        setFavoriteLoadingId(null);
      }
    },
    [navigate, setItems, showToast]
  );

  return {
    handleToggleFavorite,
    toastMessage,
    showToast,
    favoriteLoadingId
  };
}

export default useFavoriteToggle;
