import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, BookOpen, Grid3X3, List } from 'lucide-react';
import API from '../api/axios';
import TopicCard from '../components/topics/TopicCard';
import TopicForm from '../components/topics/TopicForm';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import toast from 'react-hot-toast';
import { useReflection } from '../context/ReflectionContext';

const Topics = () => {
  const { fetchReflections } = useReflection();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [deleteTopic, setDeleteTopic] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showArchived, setShowArchived] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterTag) params.set('tag', filterTag);
      if (showArchived) params.set('archived', 'true');
      
      const [topicsRes, reflectionsData] = await Promise.all([
        API.get(`/topics?${params}`),
        fetchReflections()
      ]);

      const dbTopics = topicsRes.data.data;
      const reflections = reflectionsData || [];

      // Extract unique reflection topics
      const extractedTopicsSet = new Set();
      const reflectionDates = {}; // Track first reflection creation date per topic
      reflections.forEach(ref => {
        if (ref.topicsToRevise && Array.isArray(ref.topicsToRevise)) {
          ref.topicsToRevise.forEach(topic => {
            if (topic && topic.trim()) {
              const name = topic.trim();
              extractedTopicsSet.add(name);
              if (!reflectionDates[name]) {
                reflectionDates[name] = ref.createdAt;
              }
            }
          });
        }
      });

      // Filter reflection topics by search query and tags if active
      let reflectionTopics = Array.from(extractedTopicsSet).map((topicName, index) => ({
        _id: `refl-${index}`,
        title: topicName,
        subject: 'From Reflection',
        description: 'Extracted automatically from daily reflection logs.',
        difficulty: 3,
        memoryScore: 75,
        revisionCount: 1,
        totalScheduled: 5,
        tags: ['reflection'],
        dateLearnerd: reflectionDates[topicName] || new Date(),
        isArchived: false
      }));

      // Apply client-side search/tag filter to reflection topics to match db query
      if (search) {
        const lowerSearch = search.toLowerCase();
        reflectionTopics = reflectionTopics.filter(t => 
          t.title.toLowerCase().includes(lowerSearch) || 
          t.description.toLowerCase().includes(lowerSearch)
        );
      }
      if (filterTag) {
        const lowerTag = filterTag.toLowerCase();
        reflectionTopics = reflectionTopics.filter(t => 
          t.tags.some(tg => tg.toLowerCase() === lowerTag) ||
          lowerTag === 'reflection'
        );
      }

      // Hide reflection topics if looking at archived ones
      if (showArchived) {
        reflectionTopics = [];
      }

      // Merge both topic sets, checking for duplicates
      const dbTitles = new Set(dbTopics.map(t => t.title.toLowerCase().trim()));
      const uniqueReflectionTopics = reflectionTopics.filter(t => !dbTitles.has(t.title.toLowerCase().trim()));

      setTopics([...dbTopics, ...uniqueReflectionTopics]);
    } catch {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [search, filterTag, showArchived]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await API.post('/topics', formData);
      toast.success('Topic created with revision schedule! 📅');
      setShowCreateModal(false);
      fetchTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await API.put(`/topics/${editTopic._id}`, formData);
      toast.success('Topic updated successfully');
      setEditTopic(null);
      fetchTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update topic');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/topics/${deleteTopic._id}`);
      toast.success('Topic and all revisions deleted');
      setDeleteTopic(null);
      fetchTopics();
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  const handleArchive = async (topic) => {
    try {
      await API.put(`/topics/${topic._id}`, { isArchived: !topic.isArchived });
      toast.success(topic.isArchived ? 'Topic unarchived' : 'Topic archived');
      fetchTopics();
    } catch {
      toast.error('Failed to archive topic');
    }
  };

  // Collect all unique tags
  const allTags = [...new Set(topics.flatMap((t) => t.tags || []))].slice(0, 12);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-primary-400" size={24} />
            My Topics
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {topics.length} topic{topics.length !== 1 ? 's' : ''} • Each creates 5 revision slots
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              showArchived
                ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                : 'bg-dark-800/60 text-dark-400 border-dark-700/40 hover:text-dark-200'
            }`}
          >
            {showArchived ? 'Archived' : 'Active'}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2.5 rounded-xl bg-dark-800/60 border border-dark-700/40 text-dark-400 hover:text-dark-200 transition-colors"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          </button>
        </div>
      </div>

      {/* Tag Filter Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              !filterTag
                ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                : 'bg-dark-800/40 text-dark-500 border-dark-700/30 hover:text-dark-300'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filterTag === tag
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                  : 'bg-dark-800/40 text-dark-500 border-dark-700/30 hover:text-dark-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Topics Grid / List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" text="Loading topics..." />
        </div>
      ) : topics.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300 mb-2">No topics yet</h3>
          <p className="text-dark-500 text-sm">
            Your topics will be extracted automatically from your daily reflections.
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
        }>
          {topics.map((topic) => (
            <TopicCard
              key={topic._id}
              topic={topic}
              onEdit={setEditTopic}
              onDelete={setDeleteTopic}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Topic"
        size="lg"
      >
        <TopicForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTopic}
        onClose={() => setEditTopic(null)}
        title="Edit Topic"
        size="lg"
      >
        <TopicForm
          initialData={editTopic}
          onSubmit={handleUpdate}
          onCancel={() => setEditTopic(null)}
          loading={formLoading}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTopic}
        onClose={() => setDeleteTopic(null)}
        title="Delete Topic"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTopic(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-red-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">Delete "{deleteTopic?.title}"?</h3>
          <p className="text-dark-400 text-sm">
            This will permanently delete the topic and all 5 scheduled revisions. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Topics;
