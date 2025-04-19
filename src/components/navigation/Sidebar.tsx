import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Book, Plus, Folder, File, Settings, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Board = Database['public']['Tables']['boards']['Row'];
type Page = Database['public']['Tables']['pages']['Row'];

interface SidebarProps {
  onClose: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchUserContent = async () => {
        setIsLoading(true);
        
        try {
          // Fetch boards
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
            
          if (boardsError) throw boardsError;
          setBoards(boardsData || []);
          
          // Fetch pages
          const { data: pagesData, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
            
          if (pagesError) throw pagesError;
          setPages(pagesData || []);
          
        } catch (error) {
          console.error('Error fetching user content:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserContent();
      
      // Subscribe to changes with payload-based updates instead of refetching
      const boardsSubscription = supabase
        .channel('public:boards')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'boards', filter: `owner_id=eq.${user.id}` }, 
          (payload) => {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setBoards(current => [payload.new as Board, ...current]);
            } else if (payload.eventType === 'DELETE') {
              setBoards(current => current.filter(board => board.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setBoards(current => 
                current.map(board => 
                  board.id === payload.new.id ? payload.new as Board : board
                )
              );
            }
          }
        )
        .subscribe();
        
      const pagesSubscription = supabase
        .channel('public:pages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pages', filter: `owner_id=eq.${user.id}` }, 
          (payload) => {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setPages(current => [payload.new as Page, ...current]);
            } else if (payload.eventType === 'DELETE') {
              setPages(current => current.filter(page => page.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setPages(current => 
                current.map(page => 
                  page.id === payload.new.id ? payload.new as Page : page
                )
              );
            }
          }
        )
        .subscribe();
        
      return () => {
        boardsSubscription.unsubscribe();
        pagesSubscription.unsubscribe();
      };
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
      setIsCreateBoardOpen(false);
      
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
      setIsCreatePageOpen(false);
      
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
          <Book className="w-6 h-6 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">Study Track</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 mt-4 overflow-y-auto">
        <Link 
          to="/" 
          className={`flex items-center px-3 py-2 mb-2 rounded-md transition-colors ${
            location.pathname === '/' 
              ? 'bg-primary-50 text-primary-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={onClose}
        >
          <Home className="w-5 h-5 mr-3" />
          <span>Dashboard</span>
        </Link>
        
        {/* Boards Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 group">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Boards</h3>
            <button 
              onClick={() => setIsCreateBoardOpen(!isCreateBoardOpen)}
              className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none"
              aria-label="Add board"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isCreateBoardOpen && (
            <form onSubmit={createNewBoard} className="mb-3 px-3">
              <input
                type="text"
                placeholder="Board title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBoardOpen(false)}
                  className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs text-white bg-primary-600 rounded hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-t-2 border-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <ul className="space-y-1">
              {boards.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 italic">
                  No boards yet
                </li>
              ) : (
                boards.map((board) => (
                  <li key={board.id}>
                    <Link
                      to={`/board/${board.id}`}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        location.pathname === `/board/${board.id}`
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={onClose}
                    >
                      <Folder className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate">{board.title}</span>
                    </Link>
                  </li>
                ))
              )}
              
              <li>
                <button
                  onClick={() => setIsCreateBoardOpen(!isCreateBoardOpen)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                  <span>New Board</span>
                </button>
              </li>
            </ul>
          )}
        </div>
        
        {/* Pages Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 group">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Pages</h3>
            <button 
              onClick={() => setIsCreatePageOpen(!isCreatePageOpen)}
              className="invisible group-hover:visible p-1 text-gray-400 rounded hover:text-gray-600 focus:outline-none"
              aria-label="Add page"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isCreatePageOpen && (
            <form onSubmit={createNewPage} className="mb-3 px-3">
              <input
                type="text"
                placeholder="Page title"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePageOpen(false)}
                  className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs text-white bg-primary-600 rounded hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-t-2 border-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <ul className="space-y-1">
              {pages.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 italic">
                  No pages yet
                </li>
              ) : (
                pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      to={`/page/${page.id}`}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        location.pathname === `/page/${page.id}`
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={onClose}
                    >
                      <File className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </Link>
                  </li>
                ))
              )}
              
              <li>
                <button
                  onClick={() => setIsCreatePageOpen(!isCreatePageOpen)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <PlusCircle className="w-4 h-4 mr-3 text-gray-500" />
                  <span>New Page</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <button className="flex items-center px-3 py-2 w-full text-gray-700 rounded-md hover:bg-gray-100">
          <Settings className="w-5 h-5 mr-3" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;