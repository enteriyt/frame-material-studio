package com.example.studio;

import com.example.studio.Models.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class TaskWorkerTest {
    @TempDir Path directory;
    StudioMapper mapper;
    Storage storage;
    Asset asset;
    @BeforeEach void setup() throws Exception {
        mapper=mock(StudioMapper.class);storage=new Storage(directory.toString());
        Files.write(directory.resolve("uploads/source.png"),new byte[]{1,2,3});
        asset=new Asset("asset","owner","/files/uploads/source.png",3,"image/png",LocalDateTime.now());
        when(mapper.taskAssets("job")).thenReturn(List.of(asset));
        when(mapper.update(anyString(),any(),any(),nullable(String.class),nullable(String.class))).thenReturn(1);
    }
    Task task(Stage fail,Status status) {return new Task("job","owner","portrait","Portrait",status,Stage.WAITING,null,null,fail,1,LocalDateTime.now(),LocalDateTime.now());}
    @Test void successRunsOrderedStagesAndPersistsResult() throws Exception {
        when(mapper.task("job")).thenReturn(task(null,Status.QUEUED));new TaskWorker(mapper,storage).execute("job");
        var order=inOrder(mapper);order.verify(mapper).update("job",Status.RUNNING,Stage.CHECK,null,null);
        order.verify(mapper).update("job",Status.RUNNING,Stage.GENERATE,null,null);
        order.verify(mapper).update("job",Status.RUNNING,Stage.FINALIZE,null,null);
        order.verify(mapper).update("job",Status.SUCCEEDED,Stage.DONE,"/files/results/job.png",null);
        assertArrayEquals(Files.readAllBytes(storage.path(asset.url())),Files.readAllBytes(directory.resolve("results/job.png")));
    }
    @Test void failureAtEachStageStopsLaterStages() {
        for(Stage fail:List.of(Stage.CHECK,Stage.GENERATE,Stage.FINALIZE)) {
            clearInvocations(mapper);when(mapper.task("job")).thenReturn(task(fail,Status.QUEUED));new TaskWorker(mapper,storage).execute("job");
            verify(mapper).update(eq("job"),eq(Status.FAILED),eq(fail),isNull(),contains("失败"));
            verify(mapper,never()).update(eq("job"),eq(Status.SUCCEEDED),any(),any(),any());
            if(fail==Stage.CHECK)verify(mapper,never()).update("job",Status.RUNNING,Stage.GENERATE,null,null);
            if(fail!=Stage.FINALIZE)verify(mapper,never()).update("job",Status.RUNNING,Stage.FINALIZE,null,null);
        }
    }
    @Test void terminalTaskNeverRunsAgain(){when(mapper.task("job")).thenReturn(task(null,Status.SUCCEEDED));new TaskWorker(mapper,storage).execute("job");verify(mapper,never()).update(anyString(),any(),any(),any(),any());}
    @Test void missingAssetFailsCheck(){when(mapper.task("job")).thenReturn(task(null,Status.QUEUED));when(mapper.taskAssets("job")).thenReturn(List.of());new TaskWorker(mapper,storage).execute("job");verify(mapper).update(eq("job"),eq(Status.FAILED),eq(Stage.CHECK),isNull(),contains("素材文件缺失"));verify(mapper,never()).update("job",Status.RUNNING,Stage.GENERATE,null,null);}
}
