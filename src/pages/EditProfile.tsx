import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, User, Image as ImageIcon, Trash, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/appStore';
import { useQueryClient } from '@tanstack/react-query';

export default function EditProfile() {
  const navigate = useNavigate();
  const identity = useAppStore((state) => state.identity);
  const updateIdentity = useAppStore((state) => state.updateIdentity);

  const [name, setName] = useState(identity.full_name);
  const [avatar, setAvatar] = useState(identity.avatarUri);
  const [bio, setBio] = useState(identity.bio || '');
  const [tags, setTags] = useState<string[]>(identity.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateIdentity({ full_name: name, avatarUri: avatar, bio, tags });
    navigate(-1);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="min-h-screen bg-background flex flex-col w-full max-w-lg mx-auto pb-20"
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-bold font-space text-foreground">Edit Profile</h2>
        <button onClick={handleSave} className="text-primary font-bold px-4 py-2">Save</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="relative">
            <div className="h-32 w-32 rounded-[32px] border-4 border-white/5 bg-muted flex items-center justify-center overflow-hidden shadow-2xl">
              {avatar ? <img src={avatar} className="h-full w-full object-cover" /> : <User className="h-16 w-16 text-muted-foreground/40" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setAvatar(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl h-9 gap-2 border-border/40 bg-muted/20 text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Gallery
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAvatar(null)}
              className="rounded-xl h-9 gap-2 text-destructive hover:bg-destructive/10"
            >
              <Trash className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground ml-1 font-bold">Display Name</Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              className="h-12 rounded-2xl bg-muted/20 border-border/50 font-medium text-foreground" 
              placeholder="Your name" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground ml-1 font-bold">Bio</Label>
            <Textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              className="min-h-[100px] rounded-2xl bg-muted/20 border-border/50 resize-none py-4 px-4 text-foreground placeholder:text-muted-foreground/50" 
              placeholder="Tell us about your journey..."
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground ml-1 font-bold">Personal Tags</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(t => (
                <motion.div 
                  key={t}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
                >
                  <span className="text-[10px] font-bold text-primary">{t}</span>
                  <button onClick={() => removeTag(t)} className="text-primary/60 hover:text-primary">
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="relative">
              <Input 
                value={tagInput} 
                onChange={e => setTagInput(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                className="h-12 rounded-2xl bg-muted/20 border-border/50 pl-10 text-foreground" 
                placeholder="Add a tag..."
              />
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <button 
                onClick={addTag}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
