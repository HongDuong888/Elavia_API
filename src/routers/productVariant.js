import { Router } from "express";
import {
  getProductVariants,
  getProductVariantById,
  getColorsByProductVariantId,
  getColorsByProductId,
  getRelatedVariantsByVariant,
  getAllUniqueProductsFromVariants,
  getVariantByColor,
  getAllRepresentativeVariants,
  searchProducts,
  getProductVariantsByCategory
} from "../controllers/productVariant.js";
import { getRecentlyViewedProducts } from "../controllers/productVariant.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { get } from "mongoose";

const router = Router();

router.get("/", getProductVariants);
router.get("/recently-viewed", checkAuth, getRecentlyViewedProducts);
router.get("/colors-variant/:id", getColorsByProductVariantId);
router.post("/colors-product/:id", getColorsByProductId);
router.get("/:variantId/related-variants", getRelatedVariantsByVariant);
router.get("/representativeVariant", getAllRepresentativeVariants);
router.get("/products-unique", getAllUniqueProductsFromVariants);
router.post("/by-color", getVariantByColor);
router.post("/search", searchProducts);
router.get("/:id", getProductVariantById);
router.post("/by-category", getProductVariantsByCategory);
export default router;
