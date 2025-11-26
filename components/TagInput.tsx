"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface TagInputProps {
    selectedTags: string[]
    onTagsChange: (tags: string[]) => void
}

export default function TagInput({ selectedTags, onTagsChange }: TagInputProps) {
    const [inputValue, setInputValue] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchTags = async () => {
            if (inputValue.length < 2) {
                setSuggestions([])
                return
            }

            const supabase = createClient()
            const { data } = await supabase
                .from("tags")
                .select("name")
                .ilike("name", `${inputValue}%`)
                .limit(5)

            if (data) {
                setSuggestions(data.map(t => t.name))
            }
        }

        const debounce = setTimeout(fetchTags, 200)
        return () => clearTimeout(debounce)
    }, [inputValue])

    const handleAddTag = async (tagName: string) => {
        const trimmedTag = tagName.trim().toLowerCase()
        
        if (!trimmedTag || selectedTags.includes(trimmedTag)) {
            setInputValue("")
            setShowSuggestions(false)
            return
        }

        // Create tag if it doesn't exist
        const supabase = createClient()
        await supabase
            .from("tags")
            .upsert({ name: trimmedTag }, { onConflict: "name" })

        onTagsChange([...selectedTags, trimmedTag])
        setInputValue("")
        setShowSuggestions(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault()
            handleAddTag(inputValue)
        } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
            onTagsChange(selectedTags.slice(0, -1))
        }
    }

    const removeTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-300 border border-cyan-700">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-cyan-100 transition-colors">
                            ×
                        </button>
                    </span>
                ))}
            </div>
            
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Add tags (press Enter)..."
                    className="w-full px-3 py-2 bg-background dark:bg-[#0a0e1f] border-2 border-border dark:border-[#1a2a4a] rounded text-foreground text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-600"
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 card-dark border-2 border-dark rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleAddTag(suggestion)}
                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-gray-200 dark:hover:bg-[#2a3a5a] transition-colors">
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
                Type and press Enter to add tags. Use existing tags for better discoverability.
            </p>
        </div>
    )
}
