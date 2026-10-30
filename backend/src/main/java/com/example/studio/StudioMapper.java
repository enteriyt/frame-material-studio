package com.example.studio;

import com.example.studio.Models.*;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface StudioMapper {
    String TEMPLATE_COLUMNS = "id,title,category,description,cover_url AS coverUrl,required_image_count AS requiredImageCount,max_file_size_bytes AS maxFileSizeBytes";
    String ASSET_COLUMNS = "id,owner_id AS ownerId,url,size_bytes AS sizeBytes,mime_type AS mimeType,created_at AS createdAt";
    String TASK_COLUMNS = "id,owner_id AS ownerId,template_id AS templateId,template_title AS templateTitle,status,stage,result_url AS resultUrl,error,fail_stage AS failStage,delay_ms AS delayMs,created_at AS createdAt,updated_at AS updatedAt";
    @Select("SELECT " + TEMPLATE_COLUMNS + " FROM templates ORDER BY id")
    List<Template> templates();
    @Select("SELECT " + TEMPLATE_COLUMNS + " FROM templates WHERE id=#{id}")
    Template template(String id);
    @Insert("INSERT INTO assets VALUES(#{id},#{ownerId},#{url},#{sizeBytes},#{mimeType},#{createdAt})")
    void insertAsset(Asset asset);
    @Select("SELECT " + ASSET_COLUMNS + " FROM assets WHERE id=#{id} AND owner_id=#{owner}")
    Asset asset(@Param("id") String id, @Param("owner") String owner);
    @Insert("INSERT INTO tasks VALUES(#{id},#{ownerId},#{templateId},#{templateTitle},#{status},#{stage},#{resultUrl},#{error},#{failStage},#{delayMs},#{createdAt},#{updatedAt})")
    void insertTask(Task task);
    @Insert("INSERT INTO task_assets VALUES(#{task},#{asset},#{position})")
    void link(@Param("task") String task, @Param("asset") String asset, @Param("position") int position);
    @Select("SELECT " + TASK_COLUMNS + " FROM tasks WHERE id=#{id}")
    Task task(String id);
    @Select("SELECT " + TASK_COLUMNS + " FROM tasks WHERE owner_id=#{owner} ORDER BY created_at DESC,id DESC LIMIT 200")
    List<Task> tasks(String owner);
    @Select("SELECT a.id,a.owner_id AS ownerId,a.url,a.size_bytes AS sizeBytes,a.mime_type AS mimeType,a.created_at AS createdAt FROM assets a JOIN task_assets t ON a.id=t.asset_id WHERE t.task_id=#{id} ORDER BY t.position_no")
    List<Asset> taskAssets(String id);
    @Update("UPDATE tasks SET status=#{status},stage=#{stage},result_url=#{result},error=#{error},updated_at=CURRENT_TIMESTAMP(6) WHERE id=#{id} AND status IN ('QUEUED','RUNNING')")
    int update(@Param("id") String id, @Param("status") Status status, @Param("stage") Stage stage,
               @Param("result") String result, @Param("error") String error);
}
