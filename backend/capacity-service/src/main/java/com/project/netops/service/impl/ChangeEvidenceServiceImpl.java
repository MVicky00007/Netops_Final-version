package com.project.netops.service.impl;

import com.project.netops.dto.response.ChangeEvidenceResponse;
import com.project.netops.exception.BadRequestException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.ChangeEvidenceMapper;
import com.project.netops.model.CapacityPlan;
import com.project.netops.model.ChangeEvidence;
import com.project.netops.model.User;
import com.project.netops.repository.CapacityPlanRepository;
import com.project.netops.repository.ChangeEvidenceRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.AuditLogService;
import com.project.netops.service.ChangeEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChangeEvidenceServiceImpl implements ChangeEvidenceService {

    private final ChangeEvidenceRepository evidenceRepository;
    private final CapacityPlanRepository planRepository;
    private final UserRepo userRepository;
    private final AuditLogService auditLogService;
    private final ChangeEvidenceMapper mapper;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    @Transactional
    public ChangeEvidenceResponse uploadEvidence(Long planId, MultipartFile file,
                                                  Long uploadedById, String notes) {
        CapacityPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found."));
        User uploadedBy = userRepository.findById(uploadedById.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File must not be empty.");
        }

        String originalFilename = file.getOriginalFilename();
        String safeName = Paths.get(originalFilename != null ? originalFilename : "upload")
                .getFileName().toString();
        String storedFilename = UUID.randomUUID() + "_" + safeName;

        try {
            Path planDir = Paths.get(uploadDir, String.valueOf(planId));
            Files.createDirectories(planDir);
            Path targetPath = planDir.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String sha256 = computeSha256(file.getBytes());

            ChangeEvidence evidence = ChangeEvidence.builder()
                    .plan(plan).fileUri(targetPath.toString())
                    .originalFilename(originalFilename).fileHash(sha256)
                    .uploadedBy(uploadedBy).notes(notes)
                    .build();

            ChangeEvidence saved = evidenceRepository.save(evidence);

            auditLogService.logAction(uploadedById, "UPLOAD_EVIDENCE",
                    "ChangeEvidence", saved.getEvidenceId(),
                    "File uploaded for planId " + planId + ": " + originalFilename);

            return mapper.toResponse(saved);

        } catch (IOException e) {
            throw new ResourceNotFoundException("Failed to store file.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeEvidenceResponse> listEvidence(Long planId) {
        planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found."));
        return evidenceRepository.findByPlanPlanId(planId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadEvidenceFile(Long evidenceId) {
        ChangeEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found."));
        try {
            Path filePath = Paths.get(evidence.getFileUri());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("Could not read file.");
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Error forming file path.");
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException e) {
            return "hash-unavailable";
        }
    }
}
