package com.mycompany.backend.services;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class GridFsService {

    @Autowired
    private GridFsTemplate gridFsTemplate;
// Enregistrer un fichier dans GridFS
    @Autowired
    private GridFsOperations operations;

    public String saveFile(MultipartFile file) throws IOException {
        return gridFsTemplate.store(
                file.getInputStream(),
                file.getOriginalFilename(),
                file.getContentType()
        ).toString();
    }
// Récupérer un fichier depuis GridFS par son ID
    public GridFsResource getFile(String id) {
        GridFSFile file = gridFsTemplate.findOne(
                Query.query(Criteria.where("_id").is(id))
        );
        if(file == null) throw new RuntimeException("File not found in GridFS");
        return operations.getResource(file);
    }
    // Supprimer un fichier de GridFS par son ID
    public void deleteFile(String fileId) {
        gridFsTemplate.delete(Query.query(Criteria.where("_id").is(fileId)));
    }

}
