import { Global, Module } from '@nestjs/common';
import { BulkheadService } from './bulkhead.service';
import { FallbackService } from './fallback.service';
import { DegradationService } from './degradation.service';
import { IncidentService } from './incident.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { CascadeDetectorService } from './cascade-detector.service';

/**
 * Groups the platform resilience patterns (bulkhead isolation, fallback
 * execution, graceful degradation, incident tracking, circuit breaking,
 * retry logic, and cascade detection) into a single globally-available
 * module so any feature module can inject them without re-importing.
 */
@Global()
@Module({
  providers: [
    BulkheadService,
    FallbackService,
    DegradationService,
    IncidentService,
    CircuitBreakerService,
    RetryService,
    CascadeDetectorService,
  ],
  exports: [
    BulkheadService,
    FallbackService,
    DegradationService,
    IncidentService,
    CircuitBreakerService,
    RetryService,
    CascadeDetectorService,
  ],
})
export class ResilienceModule {}
