package com.stockapp.auth.service;

import com.stockapp.auth.dto.CreateRoleRequest;
import com.stockapp.auth.dto.RoleDto;
import com.stockapp.auth.entity.Role;
import com.stockapp.auth.repository.RoleRepository;
import com.stockapp.common.exception.ApiException;
import com.stockapp.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public List<RoleDto> listRoles() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleDto(r.getRoleId(), r.getRoleName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleDto getRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId.toString()));
        return new RoleDto(role.getRoleId(), role.getRoleName());
    }

    public RoleDto createRole(CreateRoleRequest request) {
        if (roleRepository.existsByRoleName(request.roleName().toUpperCase())) {
            throw new ApiException(HttpStatus.CONFLICT, "Role already exists: " + request.roleName());
        }
        Role role = roleRepository.save(new Role(request.roleName().toUpperCase()));
        return new RoleDto(role.getRoleId(), role.getRoleName());
    }

    public RoleDto updateRole(Long roleId, CreateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId.toString()));
        role.setRoleName(request.roleName().toUpperCase());
        return new RoleDto(role.getRoleId(), role.getRoleName());
    }

    public void deleteRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId.toString()));
        roleRepository.delete(role);
    }
}
