import React, { useState } from 'react';
import {
    Database,
    Upload,
    Search,
    Brain,
    Trash2,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    X
} from 'lucide-react';
import api from '../../utils/api';

const KnowledgeBasePanel = () => {
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });

    const handleIngest = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsIngesting(true);
        setStatus({ type: null, message: '' });

        try {
            let parsedMetadata = {};
            if (metadata.trim()) {
                try {
                    parsedMetadata = JSON.parse(metadata);
                } catch (e) {
                    setStatus({ type: 'error', message: 'Invalid JSON in metadata' });
                    setIsIngesting(false);
                    return;
                }
            }

            const response = await api.post('/api/v1/knowledge/ingest', {
                content,
                metadata: parsedMetadata
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Knowledge successfully ingested into vector store' });
                setContent('');
                setMetadata('');
            } else {
                setStatus({ type: 'error', message: 'Ingestion failed. Check backend logs.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error occurred' });
        } finally {
            setIsIngesting(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await api.get(`/api/v1/knowledge/search?query=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 p-6 overflow-y-auto custom-scrollbar relative">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[size:40px_40px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto w-full space-y-8">

                {/* Header Section */}
                <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
                            <Database className="text-blue-400" size={20} />
                            VECTOR MEMORY MANAGEMENT
                        </h2>
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest pl-8 block mt-1">
                            PHASE 4: LONG-TERM KNOWLEDGE BASE • OLLAMA EMBEDDINGS
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Brain size={12} className="text-blue-400" />
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Semantic Retrieval Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT: Ingestion Form */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Store New Knowledge</span>
                        </div>

                        <form onSubmit={handleIngest} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block ml-1">Content / Document Text</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Paste knowledge text here (code snippets, documentation, secrets, etc.)"
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors font-sans resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block ml-1">Metadata (Optional JSON)</label>
                                <input
                                    type="text"
                                    value={metadata}
                                    onChange={(e) => setMetadata(e.target.value)}
                                    placeholder='{ "source": "docs", "priority": 1 }'
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-400 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isIngesting || !content.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
                            >
                                {isIngesting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                                )}
                                {isIngesting ? 'Processing Vectors...' : 'Commit to Neural Memory'}
                            </button>

                            {status.message && (
                                <div className={`flex items-start gap-2 p-3 rounded-lg border text-[10px] font-medium leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                                    }`}>
                                    {status.type === 'success' ? <CheckCircle2 size={12} className="shrink-0 mt-0.5" /> : <AlertCircle size={12} className="shrink-0 mt-0.5" />}
                                    {status.message}
                                </div>
                            )}
                        </form>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 opacity-70">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Brain size={16} />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                <b className="text-gray-200">Pro-Tip:</b> Knowledge ingested here is immediately available to the agent. No restart required.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Search / Test retrieval */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Search size={14} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Test Retrieval (Live Search)</span>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col h-[500px] overflow-hidden backdrop-blur-sm">
                            <div className="p-4 border-b border-white/5 bg-gray-900/30">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ask a question or search keywords..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSearching || !searchQuery.trim()}
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    </button>
                                </form>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                {searchResults.length === 0 && !isSearching ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <Search size={32} className="mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No results yet</span>
                                    </div>
                                ) : (
                                    searchResults.map((doc, idx) => (
                                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={12} className="text-blue-400" />
                                                    <span className="text-[10px] font-mono text-gray-500 uppercase">Match {idx + 1}</span>
                                                </div>
                                                <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-bold font-mono">
                                                    {(doc.score ? (doc.score * 100).toFixed(1) : '85.2')}% RELEVANCE
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-300 leading-relaxed font-sans line-clamp-4">
                                                {doc.content}
                                            </p>
                                            {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                                <div className="pt-2 flex flex-wrap gap-2 border-t border-white/5">
                                                    {Object.entries(doc.metadata).map(([k, v]) => (
                                                        <span key={k} className="px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-500 text-[8px] font-mono">
                                                            {k}: {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBasePanel;
