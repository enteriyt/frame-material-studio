package com.example.studio;

import com.example.studio.Models.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final StudioMapper mapper;
    private final Storage storage;
    private final TaskService tasks;
    public ApiController(StudioMapper mapper, Storage storage, TaskService tasks) { this.mapper = mapper; this.storage = storage; this.tasks = tasks; }
    static String owner(String token) {
        if (token == null || !token.matches("[a-f0-9]{64}"))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "缺少有效演示身份，请重新选择用户");
        // Store the digest, never the capability token itself.
        try {
            return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    @GetMapping("/health") public Map<String,String> health() { return Map.of("status", "ok"); }
    @GetMapping("/templates") public List<Template> templates(@RequestParam(required=false) String category) {
        return mapper.templates().stream().filter(t -> category == null || t.category().equals(category)).toList();
    }
    @GetMapping("/templates/{id}") public Template template(@PathVariable String id) {
        var result = mapper.template(id); if (result == null) throw ApiException.missing(); return result;
    }
    @PostMapping("/assets") public ResponseEntity<Asset> upload(@RequestHeader(value="X-User-Token", required=false) String token,
                                                              @RequestParam("file") MultipartFile file) throws IOException {
        String user = owner(token);
        Asset asset = storage.save(file, user);
        try { mapper.insertAsset(asset); }
        catch (RuntimeException e) { java.nio.file.Files.deleteIfExists(storage.path(asset.url())); throw e; }
        return ResponseEntity.status(201).body(asset);
    }
    @PostMapping("/tasks") public ResponseEntity<Task> create(@RequestHeader(value="X-User-Token", required=false) String token,
                                                            @RequestBody CreateTask request) {
        return ResponseEntity.accepted().body(tasks.create(owner(token), request));
    }
    @GetMapping("/tasks") public List<Task> history(@RequestHeader(value="X-User-Token", required=false) String token) { return mapper.tasks(owner(token)); }
    @GetMapping("/tasks/{id}") public Task task(@RequestHeader(value="X-User-Token", required=false) String token, @PathVariable String id) {
        String user = owner(token); Task task = mapper.task(id);
        if (task == null || !task.ownerId().equals(user)) throw ApiException.missing(); return task;
    }
}
