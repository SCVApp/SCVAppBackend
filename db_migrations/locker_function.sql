CREATE OR REPLACE FUNCTION check_locker_availability()
RETURNS TRIGGER AS $$
DECLARE
    old_controller_id INT;
    new_locker_id INT;
BEGIN
    IF OLD.locker_id IS NULL OR  NEW.locker_id != OLD.locker_id THEN
        IF EXISTS(SELECT 1 FROM lockers_users WHERE locker_id = NEW.locker_id AND start_time < NOW() AND (end_time IS NULL OR end_time > NOW())) THEN
            SELECT controller_id INTO old_controller_id FROM lockers WHERE id = NEW.locker_id;
            SELECT id INTO new_locker_id FROM lockers WHERE controller_id = old_controller_id AND id NOT IN (SELECT locker_id FROM lockers_users WHERE start_time < NOW() AND (end_time IS NULL OR end_time > NOW()));
            IF new_locker_id IS NULL THEN
                RAISE EXCEPTION 'No available lockers';
            ELSE
                NEW.locker_id := new_locker_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_locker
BEFORE INSERT OR UPDATE ON lockers_users
FOR EACH ROW
EXECUTE FUNCTION check_locker_availability();
