import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const normalizeCategoryPartners = (category) => {
  switch (String(category || "").trim()) {
    case "Tshirt":
      return ["Jorts", "Mesh Shorts", "Long Sleeve", "Crop Jersey"];
    case "Long Sleeve":
      return ["Tshirt", "Jorts", "Mesh Shorts"];
    case "Jorts":
      return ["Tshirt", "Long Sleeve", "Crop Jersey"];
    case "Mesh Shorts":
      return ["Tshirt", "Long Sleeve", "Crop Jersey"];
    case "Crop Jersey":
      return ["Jorts", "Mesh Shorts", "Long Sleeve"];
    default:
      return ["Tshirt", "Long Sleeve", "Jorts", "Mesh Shorts", "Crop Jersey"];
  }
};

const uniqueById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?._id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const useRecommendations = ({
  backendUrl,
  products = [],
  productId = null,
  productIds,
  category = "",
  color = "",
  userId = null,
  limit = 4,
  enabled = true,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const safeProductIds = useMemo(() => {
    return Array.isArray(productIds) ? productIds.filter(Boolean).map(String) : [];
  }, [productIds]);

  const productIdsKey = useMemo(() => {
    return safeProductIds.join("|");
  }, [safeProductIds]);

  const fallbackRecommendations = useMemo(() => {
    if (!enabled || !Array.isArray(products) || products.length === 0) return [];

    const excludedIds = new Set(
      [productId, ...safeProductIds].filter(Boolean).map((id) => String(id))
    );

    const baseCategory = category || "";
    const preferredCategories = normalizeCategoryPartners(baseCategory);

    const scored = products
      .filter((item) => item && !item.isDeleted)
      .filter((item) => !excludedIds.has(String(item._id)))
      .map((item) => {
        let score = 0;

        if (preferredCategories.includes(item.category)) score += 8;
        if (baseCategory && item.category === baseCategory) score -= 2;
        if (color && item.color && item.color === color) score += 5;
        if (item.bestseller) score += 2;
        if (item.newArrival) score += 1;
        if (item.onSale) score += 1;

        const createdAt = new Date(item.createdAt || 0).getTime();

        return {
          ...item,
          __score: score,
          __createdAt: createdAt,
        };
      })
      .sort((a, b) => {
        if (b.__score !== a.__score) return b.__score - a.__score;
        return b.__createdAt - a.__createdAt;
      })
      .slice(0, Number(limit) || 4);

    return uniqueById(scored);
  }, [enabled, products, productId, safeProductIds, category, color, limit]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      if (!enabled) {
        if (isMounted) {
          setRecommendations([]);
          setLoadingRecommendations(false);
        }
        return;
      }

      if (!backendUrl) {
        if (isMounted) {
          setRecommendations(fallbackRecommendations);
          setLoadingRecommendations(false);
        }
        return;
      }

      try {
        setLoadingRecommendations(true);

        const res = await axios.post(`${backendUrl}/api/recommendation/list`, {
          productId,
          productIds: safeProductIds,
          category,
          color,
          userId,
          limit,
        });

        if (!isMounted) return;

        if (res.data?.success) {
          const apiProducts = Array.isArray(res.data.products) ? res.data.products : [];
          setRecommendations(apiProducts.length ? apiProducts : fallbackRecommendations);
        } else {
          setRecommendations(fallbackRecommendations);
        }
      } catch (error) {
        if (!isMounted) return;

        if (error?.response?.status !== 404) {
          console.error("RECOMMENDATION FETCH ERROR:", error);
        }

        setRecommendations(fallbackRecommendations);
      } finally {
        if (isMounted) {
          setLoadingRecommendations(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [
    backendUrl,
    productId,
    productIdsKey,
    category,
    color,
    userId,
    limit,
    enabled,
    fallbackRecommendations,
    safeProductIds,
  ]);
 
  return {
    recommendations,
    loadingRecommendations,
  };
};

export default useRecommendations;