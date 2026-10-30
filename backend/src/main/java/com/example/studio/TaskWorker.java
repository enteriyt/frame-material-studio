package com.example.studio;

import com.example.studio.Models.*;
import org.springframework.stereotype.Component;
import java.nio.file.Files;

@Component
public class TaskWorker {
    private final StudioMapper mapper;
    private final Storage storage;
    public TaskWorker(StudioMapper mapper, Storage storage) { this.mapper = mapper; this.storage = storage; }
    public void execute(String id) {
        Task task = mapper.task(id);
        if (task == null || task.status() != Status.QUEUED) return;
        Stage active = Stage.CHECK;
        try {
            for (Stage stage : new Stage[]{Stage.CHECK, Stage.GENERATE, Stage.FINALIZE}) {
                active = stage;
                if (mapper.update(id, Status.RUNNING, stage, null, null) != 1) return;
                Thread.sleep(task.delayMs());
                if (task.failStage() == stage) throw new IllegalStateException("演示配置：" + label(stage) + "失败");
                var assets = mapper.taskAssets(id);
                if (stage == Stage.CHECK && (assets.isEmpty() || assets.stream().anyMatch(a -> !Files.isRegularFile(storage.path(a.url())))))
                    throw new IllegalStateException("素材文件缺失，请重新上传后创建任务");
                if (stage == Stage.FINALIZE) {
                    String result = storage.result(id, assets);
                    mapper.update(id, Status.SUCCEEDED, Stage.DONE, result, null);
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            mapper.update(id, Status.FAILED, active, null, "服务关闭，任务已停止");
        } catch (Exception e) {
            String reason = e instanceof IllegalStateException ? e.getMessage() : "处理失败：素材读取或结果保存异常";
            mapper.update(id, Status.FAILED, active, null, reason);
        }
    }
    private static String label(Stage stage) {
        return switch(stage) { case CHECK -> "素材检查"; case GENERATE -> "模拟生成"; case FINALIZE -> "结果整理"; default -> "处理"; };
    }
}
