package com.mycompany.backend.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "roles")
public class Role {
  @Id
  private String id;
  private ERole name;
  private String customName;

  public Role() {}

  public Role(ERole name) {
    this.name = name;
  }

  public Role(String customName) {
    this.customName = customName;
  }

  // Getters and Setters - NO @JsonIgnore
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public ERole getName() {
    return name;
  }

  public void setName(ERole name) {
    this.name = name;
  }

  public String getCustomName() {
    return customName;
  }

  public void setCustomName(String customName) {
    this.customName = customName;
  }

  public String getRoleName() {
    if (name != null) {
      return name.name();
    }
    return customName;
  }

  public void setRoleName(String roleName) {
    ERole eRole = ERole.fromString(roleName);
    if (eRole != null) {
      this.name = eRole;
      this.customName = null;
    } else {
      this.customName = roleName;
      this.name = null;
    }
  }

  // @JsonIgnore
  public boolean isCustomRole() {
    return customName != null && !customName.isEmpty();
  }
}