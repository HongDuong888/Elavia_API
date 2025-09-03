import Category from "../models/categories.js";
import mongoose from "mongoose";
import Product from "../models/product.js";
import {
  categorySchema,
  patchCategorySchema,
} from "../schemaValidations/categories.schema.js";

// Tạo danh mục mới
export const createCategory = async (req, res) => {
  try {
    const result = categorySchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((err) => err.message);
      return res.status(400).json({ errors });
    }

    const { parentId, level } = result.data;
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent)
        return res.status(400).json({ message: "Danh mục cha không tồn tại" });
      if (parent.level >= 3)
        return res
          .status(400)
          .json({ message: "Không thể tạo danh mục con cho cấp 3" });
      if (level !== parent.level + 1)
        return res
          .status(400)
          .json({ message: "Level phải lớn hơn level của parentId 1 đơn vị" });
    } else if (level !== 1) {
      return res
        .status(400)
        .json({ message: "Danh mục không có parentId phải có level là 1" });
    }

    const category = await Category.create(result.data);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Lấy danh sách danh mục
export const getCategories = async (req, res) => {
  try {
    const {
      _sort = "level",
      _order = "asc",
      _level,
      _parentId,
      _name = "",
    } = req.query;

    const sortOptions = { [_sort]: _order === "desc" ? -1 : 1 };

    const query = {};
    if (_level) query.level = parseInt(_level);
    if (_parentId && mongoose.Types.ObjectId.isValid(_parentId)) {
      query.parentId = new mongoose.Types.ObjectId(_parentId);
    }
    if (_name) query.name = { $regex: _name, $options: "i" };

    const categories = await Category.find(query).sort(sortOptions);

    return res.status(200).json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Lấy chi tiết danh mục
export const getCategoryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }
    return res.status(200).json(category);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Xóa danh mục
export const deleteCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: "ID danh mục không hợp lệ",
        error: "Invalid category ID" 
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        message: "Danh mục không tồn tại",
        error: "Category not found" 
      });
    }

    // 🔹 Kiểm tra danh mục con
    const childrenCount = await Category.countDocuments({ parentId: req.params.id });
    if (childrenCount > 0) {
      const children = await Category.find({ parentId: req.params.id }).select("name");
      const childrenNames = children.map(child => child.name).join(", ");

      return res.status(400).json({ 
        message: `Không thể xóa danh mục "${category.name}" vì còn ${childrenCount} danh mục con: ${childrenNames}`,
        error: `Không thể xóa danh mục "${category.name}" vì còn ${childrenCount} danh mục con: ${childrenNames}`,
        details: {
          categoryName: category.name,
          childrenCount,
          childrenNames: children.map(child => child.name),
        }
      });
    }

    // 🔹 Kiểm tra sản phẩm trong danh mục
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    if (productsCount > 0) {
      const products = await Product.find({ categoryId: req.params.id }).select("name");
      const productNames = products.map(p => p.name).slice(0, 5).join(", "); // chỉ show 5 sản phẩm đầu

      return res.status(400).json({
        message: `Không thể xóa danh mục "${category.name}" vì còn ${productsCount} sản phẩm.`,
        error: `Danh mục "${category.name}" đang chứa sản phẩm.`,
        details: {
          categoryName: category.name,
          productsCount,
          exampleProducts: products.map(p => p.name).slice(0, 5), // trả về danh sách tên
        }
      });
    }

    // 🔹 Nếu không có con & không có sản phẩm → cho phép xóa
    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: `Xóa danh mục "${category.name}" thành công`,
      data: category,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      message: "Lỗi hệ thống khi xóa danh mục",
      error: error.message,
    });
  }
};

// Lấy danh sách danh mục cha
export const getParentCategories = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    let parentCategories = [];
    let currentCategory = category;

    while (currentCategory.parentId) {
      const parentCategory = await Category.findById(currentCategory.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: "Danh mục cha không tồn tại" });
      }
      parentCategories.push(parentCategory);
      currentCategory = parentCategory;
    }

    parentCategories.reverse();
    return res.status(200).json({
      data: parentCategories,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Cập nhật danh mục
export const updateCategory = async (req, res) => {
  try {
    const result = patchCategorySchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((err) => err.message);
      return res.status(400).json({ errors });
    }

    const { parentId, level } = result.data;

    if (parentId !== undefined || level !== undefined) {
      if (parentId) {
        const parent = await Category.findById(parentId);
        if (!parent) {
          return res
            .status(400)
            .json({ message: "Danh mục cha không tồn tại" });
        }
        if (parent.level >= 3) {
          return res
            .status(400)
            .json({ message: "Không thể tạo danh mục con cho cấp 3" });
        }
        if (level !== undefined && level !== parent.level + 1) {
          return res.status(400).json({
            message: "Level phải lớn hơn level của parentId 1 đơn vị",
          });
        }
      } else if (level !== undefined && level !== 1) {
        return res
          .status(400)
          .json({ message: "Danh mục không có parentId phải có level là 1" });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      result.data,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    return res.status(200).json({
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
