package com.example.studio;

import com.example.studio.Models.Asset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class Storage {
    private final Path root;
    public Storage(@Value("${studio.storage}") String directory) throws IOException {
        root = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(root.resolve("uploads"));
        Files.createDirectories(root.resolve("results"));
        ImageIO.setUseCache(false);
    }
    public Path root() { return root; }
    public Asset save(MultipartFile file, String owner) throws IOException {
        if (file.isEmpty() || file.getSize() > 5_242_880) throw ApiException.bad("图片必须在 0～5MB 之间");
        var claimed = file.getContentType();
        if (!Set.of("image/jpeg", "image/png").contains(Objects.toString(claimed, "")))
            throw ApiException.bad("仅接受 JPEG 或 PNG 图片");
        byte[] bytes = file.getBytes();
        String actual;
        try (var stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) throw ApiException.bad("文件不是有效图片");
            var reader = readers.next();
            try {
                reader.setInput(stream);
                actual = switch (reader.getFormatName().toLowerCase(Locale.ROOT)) {
                    case "png" -> "image/png";
                    case "jpeg", "jpg" -> "image/jpeg";
                    default -> throw ApiException.bad("仅接受 JPEG 或 PNG 图片");
                };
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > 25_000_000) throw ApiException.bad("图片不得超过 2500 万像素");
                if (reader.read(0) == null) throw ApiException.bad("图片内容无法解码");
            } finally { reader.dispose(); }
        } catch (ApiException e) { throw e; }
        catch (IOException | RuntimeException e) { throw ApiException.bad("图片损坏，无法解码"); }
        if (!actual.equals(claimed)) throw ApiException.bad("图片内容与声明类型不一致");
        String id = UUID.randomUUID().toString();
        String url = "/files/uploads/" + id + (actual.equals("image/png") ? ".png" : ".jpg");
        Files.write(path(url), bytes, StandardOpenOption.CREATE_NEW);
        return new Asset(id, owner, url, bytes.length, actual, LocalDateTime.now(java.time.Clock.systemUTC()));
    }
    public Path path(String url) {
        if (url == null || !url.startsWith("/files/")) throw ApiException.bad("无效素材地址");
        Path path = root.resolve(url.substring(7)).normalize();
        if (!path.startsWith(root)) throw ApiException.bad("无效素材路径");
        return path;
    }
    public String result(String taskId, List<Asset> assets) throws IOException {
        // The mock generator packages the first input as a persistent, independently accessible result.
        String extension = assets.getFirst().mimeType().equals("image/png") ? ".png" : ".jpg";
        String url = "/files/results/" + taskId + extension;
        Files.copy(path(assets.getFirst().url()), path(url), StandardCopyOption.REPLACE_EXISTING);
        return url;
    }
}
