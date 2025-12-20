import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const TONE_COLORS = {
  zen: 'bg-green-500/20 text-green-400',
  rick: 'bg-purple-500/20 text-purple-400',
  lofi: 'bg-blue-500/20 text-blue-400',
  clinical: 'bg-gray-500/20 text-gray-400',
  dude: 'bg-amber-500/20 text-amber-400'
};

const TONE_LABELS = {
  zen: '🧘 Zen',
  rick: '🧪 Rick & Morty',
  lofi: '🎵 Lo-Fi',
  clinical: '📊 Clinical',
  dude: '🥃 Dude Mode'
};

export default function AIChatList({ chats, onDeleteChat }) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const handleChatClick = (chat) => {
    navigate(createPageUrl('AIChatView') + `?chatId=${chat.id}`);
  };

  const startEditing = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = async (chatId) => {
    try {
      await base44.entities.Chat.update(chatId, { title: editTitle });
      setEditingId(null);
      toast.success('Title updated');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const confirmDelete = (chat, e) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const deleteChat = async () => {
    if (!chatToDelete) return;
    
    if (onDeleteChat) {
      onDeleteChat(chatToDelete.id);
    }
    
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  return (
    <div className="space-y-3">
      {chats.map((chat, index) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          onClick={() => handleChatClick(chat)}
          className="bg-[#141416] border border-gray-800 rounded-xl p-4 hover:border-[#25A55F]/30 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingId === chat.id ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveTitle(chat.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle(chat.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0A0A0B] border-gray-700 text-white mb-2"
                  autoFocus
                />
              ) : (
                <h3 className="text-white font-semibold mb-2 truncate group-hover:text-[#25A55F] transition-colors">
                  {chat.title}
                </h3>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs px-2 py-1 rounded-full", TONE_COLORS[chat.toneMode])}>
                  {TONE_LABELS[chat.toneMode]}
                </span>
                {chat.updated_date && (
                  <span className="text-xs text-gray-500">
                    {new Date(chat.updated_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {chat.summary && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{chat.summary}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-[#141416] border-gray-800"
                sideOffset={5}
              >
                <DropdownMenuItem
                  onClick={(e) => startEditing(chat, e)}
                  className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem
                  onClick={(e) => confirmDelete(chat, e)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#141416] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this chat and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteChat}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}