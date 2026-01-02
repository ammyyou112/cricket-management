import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/use-toast';

interface ImageUploadProps {
    value?: string | null;
    onChange: (file: File | null) => void;
    maxSize?: number; // in MB
    isLoading?: boolean;
    className?: string;
    shape?: 'circle' | 'square' | 'rect';
}

const ImageUpload = ({
    value,
    onChange,
    maxSize = 2, // Default 2MB
    isLoading = false,
    className,
    shape = 'circle'
}: ImageUploadProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFile = (file: File) => {
        // Validate type
        if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
            return;
        }

        // Validate size
        if (file.size > maxSize * 1024 * 1024) {
            toast({ title: "File too large", description: `Image must be smaller than ${maxSize}MB.`, variant: "destructive" });
            return;
        }

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Trigger change
        onChange(file);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onChange(null);
    };

    const handleClick = () => {
        if (!isLoading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            <div
                className={cn(
                    "relative group cursor-pointer transition-all duration-200 ease-in-out border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/20 hover:bg-muted/40",
                    isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                    shape === 'circle' ? "rounded-full h-32 w-32" : shape === 'square' ? "rounded-md h-32 w-32" : "rounded-md h-40 w-full"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={handleClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileSelect}
                    disabled={isLoading}
                />

                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : preview ? (
                    <>
                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                        <button
                            onClick={handleRemove}
                            className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-sm hover:bg-destructive/90 transition-colors"
                            type="button"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-xs p-2 text-center">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        {shape === 'rect' ? (
                            <span>Click or drag image to upload</span>
                        ) : (
                            <span>Upload</span>
                        )}
                    </div>
                )}
            </div>
            {shape === 'rect' && !preview && (
                <p className="text-xs text-muted-foreground">
                    Support JPG, PNG. Max {maxSize}MB.
                </p>
            )}
        </div>
    );
};

export default ImageUpload;
