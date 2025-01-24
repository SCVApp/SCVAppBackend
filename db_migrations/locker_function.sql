CREATE OR REPLACE FUNCTION check_locker_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.locker_id IS NULL OR  NEW.locker_id != OLD.locker_id THEN
        IF EXISTS(SELECT 1 FROM lockers_users WHERE locker_id = NEW.locker_id AND start_time < NOW() AND (end_time IS NULL OR end_time > NOW())) THEN
            RAISE EXCEPTION 'This locker is already in use';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_locker
BEFORE INSERT OR UPDATE ON lockers_users
FOR EACH ROW
EXECUTE FUNCTION check_locker_availability();
