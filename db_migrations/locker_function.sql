create or replace function public.check_locker_availability() returns trigger
    language plpgsql
as
$$
BEGIN
    -- Check if locker_id, start_time, or end_time have changed
    IF OLD.locker_id IS NULL OR NEW.locker_id != OLD.locker_id OR NEW.end_time IS NULL OR NEW.end_time > NOW() THEN
        IF EXISTS(
            SELECT 1
            FROM lockers_users
            WHERE locker_id = NEW.locker_id
              AND id NOT IN (NEW.id, OLD.id)
              AND start_time < NOW()
              AND (end_time IS NULL OR end_time > NOW())
        ) THEN
            RAISE EXCEPTION 'This locker is already in use';
        END IF;
    END IF;

    -- Check if user has reached the maximum number of lockers
    IF TG_OP IN ('INSERT', 'UPDATE') AND
       (OLD.user_id IS NULL OR NEW.user_id != OLD.user_id OR OLD.locker_id IS NULL OR NEW.locker_id != OLD.locker_id OR
        NEW.end_time IS NULL OR NEW.end_time > NOW()) THEN
        IF (SELECT COUNT(*)
            FROM lockers_users
            WHERE user_id = NEW.user_id
              AND id NOT IN (NEW.id, OLD.id)
              AND start_time < NOW()
              AND (end_time IS NULL OR end_time > NOW())) >= 2 THEN
            RAISE EXCEPTION 'The user has reached the maximum number of lockers';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER validate_locker
BEFORE INSERT OR UPDATE ON lockers_users
FOR EACH ROW
EXECUTE FUNCTION check_locker_availability();
