package com.chalobabshakori.repo;

import com.chalobabshakori.domain.Party;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartyRepository extends JpaRepository<Party, Long> {
    List<Party> findByBusinessIdAndTypeOrderByNameAsc(Long businessId, Party.Type type);

    Optional<Party> findByIdAndBusinessIdAndType(Long id, Long businessId, Party.Type type);
}
