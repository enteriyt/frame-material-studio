package com.example.studio;

import com.example.studio.Models.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.core.task.TaskRejectedException;
import java.time.*;
import java.util.*;

@Service
public class TaskService {
    private final StudioMapper mapper;
    private final TaskWorker worker;
    private final ThreadPoolTaskExecutor executor;
    private final TransactionTemplate transaction;
    private final boolean simulationEnabled;
    public TaskService(StudioMapper mapper, TaskWorker worker, ThreadPoolTaskExecutor executor,
                       TransactionTemplate transaction, @Value("${studio.simulation-enabled}") boolean simulationEnabled) {
        this.mapper = mapper; this.worker = worker; this.executor = executor;
        this.transaction = transaction; this.simulationEnabled = simulationEnabled;
    }
    public Task create(String owner, CreateTask request) {
        Template template = mapper.template(request.templateId());
        if (template == null) throw ApiException.missing();
        var ids = request.assetIds();
        if (ids == null || ids.size() != template.requiredImageCount() || new HashSet<>(ids).size() != ids.size())
            throw ApiException.bad("请为每个上传位提供不同的图片，数量须与模板要求一致");
        for (String id : ids) {
            Asset asset = mapper.asset(id, owner);
            if (asset == null || asset.sizeBytes() > template.maxFileSizeBytes() || !template.acceptedMimeTypes().contains(asset.mimeType()))
                throw ApiException.bad("素材不存在、不属于当前用户或不符合模板要求");
        }
        Stage failure = request.failStage();
        if (failure != null && !Set.of(Stage.CHECK, Stage.GENERATE, Stage.FINALIZE).contains(failure))
            throw ApiException.bad("失败阶段只能是 CHECK、GENERATE 或 FINALIZE");
        int delay = request.delayMs() == null ? 1500 : request.delayMs();
        if (delay < 100 || delay > 15000) throw ApiException.bad("每阶段耗时须为 100～15000 毫秒");
        if (!simulationEnabled && (failure != null || request.delayMs() != null)) throw ApiException.bad("模拟控制已关闭");
        var now = LocalDateTime.now(Clock.systemUTC());
        var task = new Task(UUID.randomUUID().toString(), owner, template.id(), template.title(), Status.QUEUED,
                Stage.WAITING, null, null, failure, delay, now, now);
        // Commit before dispatch: a worker never races an uncommitted task or asset relationship.
        transaction.executeWithoutResult(tx -> {
            mapper.insertTask(task);
            for (int i = 0; i < ids.size(); i++) mapper.link(task.id(), ids.get(i), i);
        });
        try { executor.execute(() -> worker.execute(task.id())); }
        catch (TaskRejectedException e) { mapper.update(task.id(), Status.FAILED, Stage.WAITING, null, "任务队列已满，请稍后重新创建任务"); }
        return mapper.task(task.id());
    }
}
