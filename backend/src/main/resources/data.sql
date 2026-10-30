INSERT INTO templates (id,title,category,description,cover_url,required_image_count,max_file_size_bytes)
SELECT 'postcard','远山来信','旅行','用两张旅途照片，留下属于你的远方。','/demo/postcard.svg',2,5242880
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE id='postcard');
INSERT INTO templates (id,title,category,description,cover_url,required_image_count,max_file_size_bytes)
SELECT 'portrait','午后光影','人像','一张照片，一段安静的午后。','/demo/portrait.svg',1,5242880
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE id='portrait');
INSERT INTO templates (id,title,category,description,cover_url,required_image_count,max_file_size_bytes)
SELECT 'collage','生活切片','创意','把三张日常照片，拼成值得收藏的记忆。','/demo/collage.svg',3,5242880
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE id='collage');
INSERT INTO templates (id,title,category,description,cover_url,required_image_count,max_file_size_bytes)
SELECT 'coast','海边假日','旅行','记录海风与阳光，把假日装进口袋。','/demo/coast.svg',1,5242880
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE id='coast');
