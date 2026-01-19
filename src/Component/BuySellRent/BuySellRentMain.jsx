import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { mainCategory } from '../../features/slices/categorySlice';
import DynamicForm from './DynamicForm/DynamicForm';
import ProductList from './ProductList/ProductList';
import Button from '../Atoms/Button/Button';
import { buySellRentApi } from '../../api/buySellRentApi';
import { useToast } from '../ToastProvider/useToast';

const BuySellRentMain = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const categoryState = useSelector((state) => state.category);
  
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'create'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('sell');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    postType: '',
    categoryId: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    state: '',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  // Load categories on component mount
  useEffect(() => {
    dispatch(mainCategory({ pageNo: 1, size: 1000000000 }))
      .then((result) => {
        if (!mainCategory.fulfilled.match(result)) {
          const { message, code } = result.payload || {};
          console.error(`Failed to fetch categories [${code}]: ${message}`);
        }
      })
      .catch((error) => {
        console.error("Unexpected error:", error);
      });
  }, [dispatch]);

  // Load posts on component mount and when filters change
  useEffect(() => {
    loadPosts();
  }, [filters]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await buySellRentApi.getPosts(filters);
      if (response.success) {
        setPosts(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Error loading posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    if (!selectedCategory) {
      showToast('Please select a category first', 'error');
      return;
    }
    setShowCreateForm(true);
    setEditingPost(null);
    setActiveTab('create');
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setSelectedCategory(post.categoryId._id || post.categoryId);
    setSelectedPostType(post.postType);
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleFormSubmitSuccess = (newPost) => {
    setShowCreateForm(false);
    setEditingPost(null);
    setActiveTab('browse');
    loadPosts(); // Refresh the list
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await buySellRentApi.deletePost(postId);
        if (response.success) {
          showToast('Post deleted successfully', 'success');
          loadPosts(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Error deleting post', 'error');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const categories = categoryState.data?.data || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Buy, Sell & Rent</h1>
        <p className="text-gray-600">Create and browse marketplace posts</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Posts
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Post
            </button>
          </nav>
        </div>
      </div>

      {/* Browse Tab Content */}
      {activeTab === 'browse' && (
        <div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Type
                </label>
                <select
                  value={filters.postType}
                  onChange={(e) => handleFilterChange('postType', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="sell">Sell</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search posts..."
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="City"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="Min price"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Max price"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({
                    postType: '',
                    categoryId: '',
                    search: '',
                    minPrice: '',
                    maxPrice: '',
                    city: '',
                    state: '',
                    page: 1,
                    limit: 10
                  })}
                  variant="secondary"
                >
                  Clear Filters
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleCreatePost}
                  variant="primary"
                >
                  Create New Post
                </Button>
              </div>
            </div>
          </div>

          {/* Product List */}
          <ProductList
            posts={posts}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        </div>
      )}

      {/* Create Tab Content */}
      {activeTab === 'create' && (
        <div>
          {!showCreateForm ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Type *
                  </label>
                  <select
                    value={selectedPostType}
                    onChange={(e) => setSelectedPostType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sell">I want to Sell</option>
                    <option value="buy">I want to Buy</option>
                    <option value="rent">I want to Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => {
                      if (!selectedCategory) {
                        showToast('Please select a category', 'error');
                        return;
                      }
                      setShowCreateForm(true);
                    }}
                    variant="primary"
                  >
                    Continue to Form
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingPost ? 'Edit Post' : `Create ${selectedPostType.charAt(0).toUpperCase() + selectedPostType.slice(1)} Post`}
                </h3>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPost(null);
                  }}
                  variant="secondary"
                >
                  Back
                </Button>
              </div>

              <DynamicForm
                categoryId={selectedCategory}
                postType={selectedPostType}
                onSubmitSuccess={handleFormSubmitSuccess}
                initialData={editingPost}
                isEdit={!!editingPost}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuySellRentMain;
