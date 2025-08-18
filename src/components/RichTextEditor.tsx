'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your chapter...",
  height = 500 
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="rich-text-editor">
      <Editor
        apiKey="no-api-key" // Use 'no-api-key' for development
        onInit={(evt: any, editor: any) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: height,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'textcolor', 'colorpicker', 'textpattern', 'codesample', 'hr',
            'pagebreak', 'nonbreaking', 'toc', 'imagetools', 'emoticons'
          ],
          toolbar: [
            'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify',
            'bullist numlist outdent indent | removeformat | help',
            'forecolor backcolor | link image media | table | code codesample',
            'hr pagebreak | emoticons charmap | fullscreen preview'
          ].join(' | '),
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre',
          font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
          content_style: `
            body { 
              font-family: Georgia, serif; 
              font-size: 16px; 
              line-height: 1.6; 
              color: #333;
              max-width: none;
              margin: 0;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 { 
              font-family: Georgia, serif; 
              margin-top: 1.5em; 
              margin-bottom: 0.5em; 
              font-weight: bold;
            }
            h1 { font-size: 2.5em; color: #2c3e50; }
            h2 { font-size: 2em; color: #34495e; }
            h3 { font-size: 1.5em; color: #34495e; }
            h4 { font-size: 1.25em; color: #34495e; }
            h5 { font-size: 1.1em; color: #34495e; }
            h6 { font-size: 1em; color: #34495e; }
            p { margin-bottom: 1em; }
            blockquote { 
              border-left: 4px solid #3498db; 
              padding-left: 1em; 
              margin-left: 0; 
              font-style: italic; 
              color: #555; 
            }
            code { 
              background-color: #f8f9fa; 
              padding: 2px 4px; 
              border-radius: 3px; 
              font-family: 'Courier New', monospace; 
            }
            pre { 
              background-color: #f8f9fa; 
              padding: 1em; 
              border-radius: 5px; 
              overflow-x: auto; 
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 5px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 1em 0; 
            }
            table td, table th { 
              border: 1px solid #ddd; 
              padding: 8px; 
            }
            table th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            a { 
              color: #3498db; 
              text-decoration: none; 
            }
            a:hover { 
              text-decoration: underline; 
            }
          `,
          placeholder: placeholder,
          branding: false,
          resize: true,
          elementpath: false,
          statusbar: true,
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          file_picker_callback: function (cb: any, value: any, meta: any) {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');

            input.onchange = function () {
              const file = (this as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function () {
                  const id = 'blobid' + (new Date()).getTime();
                  const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
                  const base64 = (reader.result as string).split(',')[1];
                  const blobInfo = blobCache.create(id, file, base64);
                  blobCache.add(blobInfo);

                  cb(blobInfo.blobUri(), { title: file.name });
                };
                reader.readAsDataURL(file);
              }
            };

            input.click();
          },
          images_upload_handler: function (blobInfo: any, success: any, failure: any) {
            // For now, we'll use base64 encoding
            // In production, you'd want to upload to your server/cloud storage
            const base64 = 'data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64();
            success(base64);
          },
          setup: function (editor: any) {
            editor.on('change', function () {
              editor.save();
            });
          },
          // Color options
          color_map: [
            "000000", "Black",
            "993300", "Burnt orange",
            "333300", "Dark olive",
            "003300", "Dark green",
            "003366", "Dark azure",
            "000080", "Navy Blue",
            "333399", "Indigo",
            "333333", "Very dark gray",
            "800000", "Maroon",
            "FF6600", "Orange",
            "808000", "Olive",
            "008000", "Green",
            "008080", "Teal",
            "0000FF", "Blue",
            "666699", "Grayish blue",
            "808080", "Gray",
            "FF0000", "Red",
            "FF9900", "Amber",
            "99CC00", "Yellow green",
            "339966", "Sea green",
            "33CCCC", "Turquoise",
            "3366FF", "Royal blue",
            "800080", "Purple",
            "999999", "Medium gray",
            "FF00FF", "Magenta",
            "FFCC00", "Gold",
            "FFFF00", "Yellow",
            "00FF00", "Lime",
            "00FFFF", "Aqua",
            "00CCFF", "Sky blue",
            "993366", "Red violet",
            "FFFFFF", "White",
            "FF99CC", "Pink",
            "FFCC99", "Peach",
            "FFFF99", "Light yellow",
            "CCFFCC", "Pale green",
            "CCFFFF", "Pale cyan",
            "99CCFF", "Light sky blue",
            "CC99FF", "Plum"
          ],
          // Text patterns for quick formatting
          textpattern_patterns: [
            {start: '*', end: '*', format: 'italic'},
            {start: '**', end: '**', format: 'bold'},
            {start: '#', format: 'h1'},
            {start: '##', format: 'h2'},
            {start: '###', format: 'h3'},
            {start: '####', format: 'h4'},
            {start: '#####', format: 'h5'},
            {start: '######', format: 'h6'},
            {start: '1. ', cmd: 'InsertOrderedList'},
            {start: '* ', cmd: 'InsertUnorderedList'},
            {start: '- ', cmd: 'InsertUnorderedList'}
          ]
        }}
      />
    </div>
  );
}
