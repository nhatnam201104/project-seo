package com.projectsale.common.validate.phone;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = PhoneValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhone {
   String message() default "Phone number is invalid";

   /** true: {@code null} hợp lệ (trường tuỳ chọn); chuỗi rỗng/sai định dạng vẫn bị từ chối. */
   boolean nullable() default false;

   Class<?>[] groups() default {};

   Class<? extends Payload>[] payload() default {};

}
