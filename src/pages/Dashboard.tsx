import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, File, Calendar, Users, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type Board = Database['public']['Tables']['boards']['Row'];
type Page = Database['public']['Tables']['pages']['Row'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentBoards, setRecentBoards] = useState<Board[]>([]);
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  useEffect(() => {
    if (user) {
      const fetchUserContent = async () => {
        setIsLoading(true);
        
        try {
          console.log('Fetching boards for user:', user.id);
          
          // Fetch recent boards
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (boardsError) {
            console.error('Error fetching boards:', boardsError);
            toast.error('Erro ao carregar boards. Por favor, tente novamente.');
            throw boardsError;
          }
          
          console.log('Boards fetched:', boardsData?.length || 0);
          setRecentBoards(boardsData || []);
          
          // Fetch recent pages
          const { data: pagesData, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (pagesError) {
            console.error('Error fetching pages:', pagesError);
            toast.error('Erro ao carregar páginas. Por favor, tente novamente.');
            throw pagesError;
          }
          
          console.log('Pages fetched:', pagesData?.length || 0);
          setRecentPages(pagesData || []);
          
        } catch (error: any) {
          console.error('Error fetching user content:', error);
          toast.error('Erro ao carregar conteúdo. Por favor, tente novamente.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserContent();
    } else {
      console.log('No user found, skipping fetch');
      setIsLoading(false);
    }
  }, [user]);

  const createNewBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBoardTitle.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title: newBoardTitle.trim(),
            owner_id: user.id,
            description: '',
            is_public: false
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        navigate(`/board/${data.id}`);
      }
      
      setNewBoardTitle('');
      setIsCreatingBoard(false);
      
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const createNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPageTitle.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            title: newPageTitle.trim(),
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
            },
            owner_id: user.id,
            is_public: false
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        navigate(`/page/${data.id}`);
      }
      
      setNewPageTitle('');
      setIsCreatingPage(false);
      
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setIsCreatingBoard(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Board
          </button>
          
          <button
            onClick={() => setIsCreatingPage(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Page
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-t-4 border-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setIsCreatingBoard(true)}
                className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center"
              >
                <Folder className="h-8 w-8 text-primary-600 mb-3" />
                <span className="text-sm font-medium text-gray-900">New Board</span>
              </button>
              
              <button
                onClick={() => setIsCreatingPage(true)}
                className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center"
              >
                <File className="h-8 w-8 text-secondary-600 mb-3" />
                <span className="text-sm font-medium text-gray-900">New Page</span>
              </button>
              
              <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center">
                <Calendar className="h-8 w-8 text-accent-600 mb-3" />
                <span className="text-sm font-medium text-gray-900">Calendar</span>
              </button>
              
              <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center">
                <Users className="h-8 w-8 text-gray-600 mb-3" />
                <span className="text-sm font-medium text-gray-900">Share</span>
              </button>
            </div>
          </div>

          {/* Recent Boards */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Boards</h2>
              <button
                onClick={() => navigate('/boards')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>
            
            {recentBoards.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No boards yet</h3>
                <p className="text-gray-600 mb-4">Create your first board to get started</p>
                <button
                  onClick={() => setIsCreatingBoard(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create a board
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBoards.map((board) => (
                  <div
                    key={board.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col cursor-pointer"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Folder className="h-6 w-6 text-primary-600" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open settings menu
                        }}
                        className="p-1 text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{board.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                      {board.description || 'No description'}
                    </p>
                    <div className="text-xs text-gray-500">
                      Created {new Date(board.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <div
                  className="bg-gray-50 rounded-lg border border-gray-200 border-dashed hover:bg-gray-100 transition-colors p-5 flex flex-col items-center justify-center cursor-pointer h-full min-h-[180px]"
                  onClick={() => setIsCreatingBoard(true)}
                >
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Create a new board</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Pages */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Pages</h2>
              <button
                onClick={() => navigate('/pages')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>
            
            {recentPages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No pages yet</h3>
                <p className="text-gray-600 mb-4">Create your first page to get started</p>
                <button
                  onClick={() => setIsCreatingPage(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create a page
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPages.map((page) => (
                  <div
                    key={page.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col cursor-pointer"
                    onClick={() => navigate(`/page/${page.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <File className="h-6 w-6 text-secondary-600" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open settings menu
                        }}
                        className="p-1 text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{page.title}</h3>
                    <div className="text-xs text-gray-500 mt-auto">
                      Last updated {new Date(page.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <div
                  className="bg-gray-50 rounded-lg border border-gray-200 border-dashed hover:bg-gray-100 transition-colors p-5 flex flex-col items-center justify-center cursor-pointer h-full min-h-[180px]"
                  onClick={() => setIsCreatingPage(true)}
                >
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Create a new page</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {isCreatingBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create a new board</h2>
            <form onSubmit={createNewBoard}>
              <div className="mb-4">
                <label htmlFor="boardTitle" className="block text-sm font-medium text-gray-700 mb-1">Board title</label>
                <input
                  type="text"
                  id="boardTitle"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter board title"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingBoard(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {isCreatingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create a new page</h2>
            <form onSubmit={createNewPage}>
              <div className="mb-4">
                <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700 mb-1">Page title</label>
                <input
                  type="text"
                  id="pageTitle"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter page title"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPage(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;