package com.example.studio;

import com.example.studio.Models.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:studio;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","studio.storage=target/test-assets"})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired StudioMapper mapper;
    private static final String USER="a".repeat(64),OTHER="b".repeat(64);
    String asset() throws Exception {
        var out=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB),"png",out);
        String response=mvc.perform(multipart("/api/assets").file(new MockMultipartFile("file","test.png","image/png",out.toByteArray())).header("X-User-Token",USER)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asText();
    }
    @Test void uploadAndCreatePersistThenExecuteIndependentlyOfQueries() throws Exception {
        String asset=asset();
        String response=mvc.perform(post("/api/tasks").header("X-User-Token",USER).contentType("application/json").content("{\"templateId\":\"portrait\",\"assetIds\":[\""+asset+"\"],\"delayMs\":100}")).andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString();
        String id=json.readTree(response).get("id").asText();
        // No GET request drives execution: wait only on persistent data in this test.
        long deadline=System.nanoTime()+5_000_000_000L;Task task;
        do{Thread.sleep(30);task=mapper.task(id);}while(task.status()!=Status.SUCCEEDED&&task.status()!=Status.FAILED&&System.nanoTime()<deadline);
        assertEquals(Status.SUCCEEDED,task.status());assertNotNull(task.resultUrl());
        mvc.perform(get("/api/tasks/"+id).header("X-User-Token",OTHER)).andExpect(status().isNotFound());
        mvc.perform(get("/api/tasks/"+id).header("X-User-Token",USER)).andExpect(jsonPath("$.status").value("SUCCEEDED"));
        mvc.perform(get(task.resultUrl())).andExpect(status().isOk());
    }
    @Test void rejectsInvalidImageAndCrossUserAssetAndWrongCount() throws Exception {
        mvc.perform(multipart("/api/assets").file(new MockMultipartFile("file","fake.png","image/png","not an image".getBytes())).header("X-User-Token",USER)).andExpect(status().isBadRequest());
        String asset=asset();
        mvc.perform(post("/api/tasks").header("X-User-Token",OTHER).contentType("application/json").content("{\"templateId\":\"portrait\",\"assetIds\":[\""+asset+"\"]}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/tasks").header("X-User-Token",USER).contentType("application/json").content("{\"templateId\":\"postcard\",\"assetIds\":[\""+asset+"\"]}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }
    @Test void templateSeedsAreAvailable() throws Exception {mvc.perform(get("/api/templates")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(4));mvc.perform(get("/api/templates/missing")).andExpect(status().isNotFound());}
}
